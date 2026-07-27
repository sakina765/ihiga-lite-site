import { Injectable } from "@nestjs/common";
import { SeasonService } from "../season/season.service";
import { SeasonInfo } from "../season/season.types";
import { districtToProvince } from "../weather/rwanda-provinces";
import { CROP_SUGGESTIONS, CropSuggestion } from "./crop-suggestions.data";

export interface CropSuggestionsResult {
  season: SeasonInfo;
  province: string | null;
  crops: CropSuggestion[];
}

@Injectable()
export class CropSuggestionsService {
  constructor(private readonly seasonService: SeasonService) {}

  async getSuggestions(district: string, date: Date = new Date()): Promise<CropSuggestionsResult> {
    const season = await this.seasonService.getCurrentSeason(date);
    const province = districtToProvince(district);
    const crops = province ? (CROP_SUGGESTIONS[season.code][province] ?? []) : [];
    return { season, province: province ?? null, crops };
  }
}
