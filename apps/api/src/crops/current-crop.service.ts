import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { Conversation } from "../chat/entities/conversation.entity";
import { CropsService } from "./crops.service";
import { Crop } from "./entities/crop.entity";
import { CropStage } from "./entities/crop-stage.entity";
import { CropStageInfo } from "../ai/types";

export interface CurrentCropResult {
  cropName: string;
  localName: string;
  stage: CropStageInfo;
  plantingDate: string;
}

/** Same field mapping chat-orchestrator.service.ts uses for CropStage → CropStageInfo. */
function toCropStageInfo(stage: CropStage): CropStageInfo {
  return {
    name: stage.name,
    weekStart: stage.weekStart,
    weekEnd: stage.weekEnd,
    taskDescription: stage.taskDescription,
    taskDescriptionRw: stage.taskDescriptionRw,
  };
}

@Injectable()
export class CurrentCropService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Crop) private readonly cropRepository: Repository<Crop>,
    private readonly cropsService: CropsService,
  ) {}

  /** The "Your Crop" sidebar card — surfaces data CropsService already computes, just never shown outside chat replies. */
  async getForFarmer(farmerId: string): Promise<CurrentCropResult | null> {
    const conversation = await this.conversationRepository.findOne({
      where: { farmerId, cropId: Not(IsNull()), plantingDate: Not(IsNull()) },
      order: { createdAt: "DESC" },
    });

    if (!conversation?.cropId || !conversation.plantingDate) {
      return null;
    }

    const crop = await this.cropRepository.findOne({ where: { id: conversation.cropId } });
    if (!crop) {
      return null;
    }

    const stage = await this.cropsService.getCurrentStage(conversation.cropId, new Date(conversation.plantingDate));

    return {
      cropName: crop.name,
      localName: crop.localName,
      stage: toCropStageInfo(stage),
      plantingDate: conversation.plantingDate,
    };
  }
}
