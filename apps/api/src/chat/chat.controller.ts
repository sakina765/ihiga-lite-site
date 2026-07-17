import { BadGatewayException, BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { GroqService } from "../ai/groq.service";
import { ChatLanguage } from "../ai/types";
import { ChatResponse, VoiceChatResponse } from "./chat.types";

// Independent of whatever limits Groq's API itself enforces — these exist so a
// huge upload gets rejected by multer/Nest before it's even buffered, instead
// of the request pipeline spending time on a file we were never going to accept.
const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — generous for a ~30s voice clip
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const ACCEPTED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/mpeg",
  "audio/m4a",
  "audio/x-m4a",
]);

const ACCEPTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

class SendMessageBody {
  conversationId?: string;
  message: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

class SendVoiceBody {
  conversationId?: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

class SendPhotoBody {
  conversationId?: string;
  caption?: string;
  cropId?: string;
  plantingDate?: string;
  language?: ChatLanguage;
}

@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatOrchestratorService: ChatOrchestratorService,
    private readonly groqService: GroqService,
  ) {}

  @Post("message")
  async sendMessage(@Body() body: SendMessageBody): Promise<ChatResponse> {
    if (!body?.message?.trim()) {
      throw new BadRequestException("message is required");
    }
    return this.chatOrchestratorService.handleMessage(body);
  }

  @Post("voice")
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: MAX_AUDIO_SIZE_BYTES } }))
  async sendVoiceMessage(@UploadedFile() audio: Express.Multer.File, @Body() body: SendVoiceBody): Promise<VoiceChatResponse> {
    if (!audio) {
      throw new BadRequestException("audio file is required");
    }
    if (!ACCEPTED_AUDIO_MIME_TYPES.has(audio.mimetype)) {
      throw new BadRequestException(`Unsupported audio type "${audio.mimetype}"`);
    }

    // Transcription and orchestration are kept as two clearly separate steps —
    // the transcribed text is handed to handleMessage() exactly like a typed
    // message, with no voice-specific branching inside the orchestrator itself.
    const transcribedText = await this.transcribe(audio);
    if (!transcribedText.trim()) {
      throw new BadRequestException("Could not make out any speech in that recording — please try again");
    }

    const chatResponse = await this.chatOrchestratorService.handleMessage({
      ...body,
      message: transcribedText,
      messageType: "voice",
    });

    return { ...chatResponse, transcribedText };
  }

  @Post("photo")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async sendPhotoMessage(@UploadedFile() image: Express.Multer.File, @Body() body: SendPhotoBody): Promise<ChatResponse> {
    if (!image) {
      throw new BadRequestException("image file is required");
    }
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(image.mimetype)) {
      throw new BadRequestException(`Unsupported image type "${image.mimetype}" — use JPEG, PNG, or WebP`);
    }

    return this.chatOrchestratorService.handlePhotoMessage({
      ...body,
      imageBuffer: image.buffer,
      mimeType: image.mimetype,
    });
  }

  private async transcribe(audio: Express.Multer.File): Promise<string> {
    try {
      return await this.groqService.transcribeAudio(audio.buffer, audio.mimetype);
    } catch (error) {
      throw new BadGatewayException(`Could not transcribe audio: ${(error as Error).message}`);
    }
  }
}
