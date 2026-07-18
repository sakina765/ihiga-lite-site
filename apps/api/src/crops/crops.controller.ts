import { Controller, Get, Query } from "@nestjs/common";
import { CropSuggestionsService, CropSuggestionsResult } from "./crop-suggestions.service";
import { CurrentCropService, CurrentCropResult } from "./current-crop.service";
import { CropsQueryDto } from "./dto/crops-query.dto";
import { SeasonService } from "../season/season.service";
import { FarmersService } from "../farmers/farmers.service";

@Controller("crops")
export class CropsController {
  constructor(
    private readonly cropSuggestionsService: CropSuggestionsService,
    private readonly currentCropService: CurrentCropService,
    private readonly seasonService: SeasonService,
    private readonly farmersService: FarmersService,
  ) {}

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
}
