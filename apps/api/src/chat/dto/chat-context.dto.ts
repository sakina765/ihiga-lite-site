import { IsIn, IsOptional, IsUUID, Matches } from "class-validator";
import { ChatLanguage } from "../../ai/types";

const CHAT_LANGUAGES: ChatLanguage[] = ["en", "rw", "fr"];
const PLANTING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Fields shared by every /chat/* request body — message, voice, and photo. */
export abstract class ChatContextDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsUUID()
  farmerId: string;

  @IsOptional()
  @IsUUID()
  cropId?: string;

  @IsOptional()
  @Matches(PLANTING_DATE_PATTERN, { message: "plantingDate must be in YYYY-MM-DD format" })
  plantingDate?: string;

  @IsOptional()
  @IsIn(CHAT_LANGUAGES)
  language?: ChatLanguage;
}
