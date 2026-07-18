import { IsOptional, IsString, MaxLength } from "class-validator";
import { ChatContextDto } from "./chat-context.dto";

export const MAX_CAPTION_LENGTH = 500;

export class SendPhotoDto extends ChatContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_CAPTION_LENGTH)
  caption?: string;
}
