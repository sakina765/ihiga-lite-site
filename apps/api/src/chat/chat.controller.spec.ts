import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as path from "path";
import { ChatController } from "./chat.controller";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { GroqService } from "../ai/groq.service";

const FIXTURES_DIR = path.join(__dirname, "..", "..", "test", "fixtures");

function makeChatResponse(replyText: string) {
  return {
    conversationId: "conv-1",
    replyText,
    suggestedChips: [],
    language: "en",
    season: {
      code: "C",
      localName: "Impeshyi",
      englishName: "Season C (dry season / irrigated & marshland farming)",
      startDate: new Date(2026, 5, 16),
      endDate: new Date(2026, 8, 14),
    },
  };
}

// Exercises the real multer/FileInterceptor multipart-upload plumbing at the
// NestJS HTTP layer with small real fixture files — ChatOrchestratorService and
// GroqService are mocked out, so this never touches a real database or Groq.
describe("ChatController (multipart upload plumbing)", () => {
  let app: INestApplication;
  let chatOrchestratorService: { handleMessage: jest.Mock; handlePhotoMessage: jest.Mock };
  let groqService: { transcribeAudio: jest.Mock };

  beforeEach(async () => {
    chatOrchestratorService = {
      handleMessage: jest.fn(async (params: { message: string }) => makeChatResponse(`echo: ${params.message}`)),
      handlePhotoMessage: jest.fn(async () => makeChatResponse("This could be pest damage, but I'm not fully certain.")),
    };
    groqService = {
      transcribeAudio: jest.fn(async () => "plant maize now"),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatOrchestratorService, useValue: chatOrchestratorService },
        { provide: GroqService, useValue: groqService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /chat/voice transcribes the uploaded audio and hands it to handleMessage as a 'voice' message", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/voice")
      .field("conversationId", "conv-1")
      .attach("audio", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(201);

    expect(groqService.transcribeAudio).toHaveBeenCalledTimes(1);
    expect(chatOrchestratorService.handleMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "plant maize now", messageType: "voice", conversationId: "conv-1" }),
    );
    expect(response.body.transcribedText).toBe("plant maize now");
    expect(response.body.replyText).toBe("echo: plant maize now");
  });

  it("POST /chat/voice rejects an unsupported audio mime type", async () => {
    await request(app.getHttpServer())
      .post("/chat/voice")
      .attach("audio", path.join(FIXTURES_DIR, "tiny.png")) // a real image, wrong field
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects when no file is attached", async () => {
    await request(app.getHttpServer()).post("/chat/voice").expect(400);
  });

  it("POST /chat/photo analyzes the uploaded image and passes the caption + mimetype through", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/photo")
      .field("caption", "What is wrong with these leaves?")
      .attach("image", path.join(FIXTURES_DIR, "tiny.png"))
      .expect(201);

    expect(chatOrchestratorService.handlePhotoMessage).toHaveBeenCalledWith(
      expect.objectContaining({ caption: "What is wrong with these leaves?", mimeType: "image/png" }),
    );
    expect(response.body.replyText).toContain("not fully certain");
  });

  it("POST /chat/photo rejects an unsupported image mime type", async () => {
    await request(app.getHttpServer())
      .post("/chat/photo")
      .attach("image", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(400);

    expect(chatOrchestratorService.handlePhotoMessage).not.toHaveBeenCalled();
  });

  it("POST /chat/photo rejects when no file is attached", async () => {
    await request(app.getHttpServer()).post("/chat/photo").expect(400);
  });
});
