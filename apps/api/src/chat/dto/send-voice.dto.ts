import { ChatContextDto } from "./chat-context.dto";

// No fields of its own — the audio file arrives via @UploadedFile(), not the
// validated body — but kept as its own class (not a bare alias) so a future
// voice-specific field has an obvious home.
export class SendVoiceDto extends ChatContextDto {}
