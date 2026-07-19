import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { CropSuggestionsService, CropSuggestionsResult } from "./crop-suggestions.service";
import { CurrentCropService, CurrentCropResult } from "./current-crop.service";
import { CropsService } from "./crops.service";
import { CropsQueryDto } from "./dto/crops-query.dto";
import { SetCurrentCropDto } from "./dto/set-current-crop.dto";
import { Crop } from "./entities/crop.entity";
import { SeasonService } from "../season/season.service";
import { FarmersService } from "../farmers/farmers.service";

@Controller("crops")
export class CropsController {
  constructor(
    private readonly cropsService: CropsService,
    private readonly cropSuggestionsService: CropSuggestionsService,
    private readonly currentCropService: CurrentCropService,
    private readonly seasonService: SeasonService,
    private readonly farmersService: FarmersService,
  ) {}

  /** Manual fallback form's crop dropdown — the full seeded crop list. */
  @Get()
  async list(): Promise<Crop[]> {
    return this.cropsService.getAllCrops();
  }

  /** Sidebar section 3 — season-appropriate crop suggestions for the farmer's province. */
  @Get("suggestions")
  async suggestions(@Query() query: CropsQueryDto): Promise<CropSuggestionsResult> {
    const farmer = await this.farmersService.getById(query.farmerId);
    if (!farmer?.district) {
      return { season: this.seasonService.getCurrentSeason(), province: null, crops: [] };
    }
    return this.cropSuggestionsService.getSuggestions(farmer.district);
  }

  /** Stretch "Your Crop" card — surfaces already-computed crop-stage data outside chat replies. */
  @Get("current-crop")
  async currentCrop(@Query() query: CropsQueryDto): Promise<CurrentCropResult | null> {
    return this.currentCropService.getForFarmer(query.farmerId);
  }

  /**
   * Manual fallback path (Phase 8.2) — the sidebar "Your crop" form submits
   * here directly, no confirmation step, since it's an explicit deliberate
   * farmer action rather than an LLM inference. Always available even if the
   * farmer has never sent a single chat message.
   */
  @Patch("current-crop")
  async setCurrentCrop(@Body() body: SetCurrentCropDto): Promise<CurrentCropResult> {
    return this.currentCropService.setForFarmer(body.farmerId, body.cropId, body.plantingDate);
  }
}
