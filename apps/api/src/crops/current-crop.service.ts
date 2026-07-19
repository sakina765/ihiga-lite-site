import { Injectable, NotFoundException } from "@nestjs/common";
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

  /**
   * Manual fallback path (sidebar's "Add your planting date" form) — always
   * available regardless of whether Groq's auto-extraction has ever fired,
   * since it doesn't depend on any prior conversation state. Writes directly
   * (no confirm step) since the farmer is the one deliberately filling this
   * in, unlike the chat auto-extraction flow. Sets cropId/plantingDate on the
   * farmer's most recent conversation, creating one if they've never
   * actually sent a chat message yet.
   */
  async setForFarmer(farmerId: string, cropId: string, plantingDate: string): Promise<CurrentCropResult> {
    const crop = await this.cropRepository.findOne({ where: { id: cropId } });
    if (!crop) {
      throw new NotFoundException(`No crop found with id "${cropId}"`);
    }

    let conversation = await this.conversationRepository.findOne({
      where: { farmerId },
      order: { createdAt: "DESC" },
    });
    if (!conversation) {
      conversation = this.conversationRepository.create({ farmerId, language: null, cropId: null, plantingDate: null });
    }
    conversation.cropId = cropId;
    conversation.plantingDate = plantingDate;
    await this.conversationRepository.save(conversation);

    const stage = await this.cropsService.getCurrentStage(cropId, new Date(plantingDate));

    return {
      cropName: crop.name,
      localName: crop.localName,
      stage: toCropStageInfo(stage),
      plantingDate,
    };
  }
}
