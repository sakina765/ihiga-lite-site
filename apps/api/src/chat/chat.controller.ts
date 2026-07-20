import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { GroqService } from "../ai/groq.service";
import { ChatResponse, ConversationHistoryResponse, VoiceChatResponse } from "./chat.types";
import { SendMessageDto } from "./dto/send-message.dto";
import { SendVoiceDto } from "./dto/send-voice.dto";
import { SendPhotoDto } from "./dto/send-photo.dto";
import { GetConversationQueryDto } from "./dto/get-conversation-query.dto";
import { isAudioSignature, isImageSignature } from "../common/file-signature.util";

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

// Moderate — these hit Groq (and voice additionally hits Whisper) on every
// call, but a farmer legitimately retrying a garbled recording or a bad photo
// a couple of times in quick succession shouldn't get blocked.
const CHAT_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatOrchestratorService: ChatOrchestratorService,
    private readonly groqService: GroqService,
  ) {}

  @Post("message")
  @Throttle(CHAT_THROTTLE)
  async sendMessage(@Body() body: SendMessageDto): Promise<ChatResponse> {
    return this.chatOrchestratorService.handleMessage(body);
  }

  // Lets the frontend resume a conversation after a refresh or navigating
  // away and back — otherwise there's no way to get message history back at
  // all, since it only ever lived in this turn's response and in-memory state.
  @Get(":id")
  async getConversation(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query() query: GetConversationQueryDto,
  ): Promise<ConversationHistoryResponse> {
    return this.chatOrchestratorService.getConversationHistory(id, query.farmerId);
  }

  // The chat page's "Delete conversation" button — see
  // ChatOrchestratorService.deleteConversationMessages for why this clears
  // messages only, not the conversation row itself.
  @Delete(":id")
  @HttpCode(204)
  async deleteConversation(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query() query: GetConversationQueryDto,
  ): Promise<void> {
    return this.chatOrchestratorService.deleteConversationMessages(id, query.farmerId);
  }

  @Post("voice")
  @Throttle(CHAT_THROTTLE)
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: MAX_AUDIO_SIZE_BYTES } }))
  async sendVoiceMessage(@UploadedFile() audio: Express.Multer.File, @Body() body: SendVoiceDto): Promise<VoiceChatResponse> {
    if (!audio) {
      throw new BadRequestException("audio file is required");
    }
    if (!ACCEPTED_AUDIO_MIME_TYPES.has(audio.mimetype)) {
      throw new BadRequestException(`Unsupported audio type "${audio.mimetype}"`);
    }
    // The client-declared mimetype above is just a string it chose to send —
    // confirm the actual bytes match a real audio file before handing them to
    // Whisper, since a client could lie about the Content-Type.
    if (!isAudioSignature(audio.buffer)) {
      throw new BadRequestException("Uploaded file does not look like a valid audio file");
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
  @Throttle(CHAT_THROTTLE)
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async sendPhotoMessage(@UploadedFile() image: Express.Multer.File, @Body() body: SendPhotoDto): Promise<ChatResponse> {
    if (!image) {
      throw new BadRequestException("image file is required");
    }
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(image.mimetype)) {
      throw new BadRequestException(`Unsupported image type "${image.mimetype}" — use JPEG, PNG, or WebP`);
    }
    if (!isImageSignature(image.buffer)) {
      throw new BadRequestException("Uploaded file does not look like a valid image");
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
