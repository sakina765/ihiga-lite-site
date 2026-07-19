import { IsIn } from "class-validator";
import { ChatLanguage } from "../../ai/types";

export class UpdatePreferredLanguageDto {
  @IsIn(["en", "rw", "fr"])
  preferredLanguage: ChatLanguage;
}
