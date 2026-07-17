import { SeasonCode } from "./season.constants";

export interface SeasonInfo {
  code: SeasonCode;
  localName: string;
  englishName: string;
  startDate: Date;
  endDate: Date;
}
