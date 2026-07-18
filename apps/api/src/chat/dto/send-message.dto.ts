import { IsString, MaxLength, MinLength } from "class-validator";
import { ChatContextDto } from "./chat-context.dto";

// Generous for SMS/chat-style input, far below anything that could bloat a
// Groq prompt or represent an accidental/abusive payload.
export const MAX_CHAT_MESSAGE_LENGTH = 2000;

export class SendMessageDto extends ChatContextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
  message: string;
}
