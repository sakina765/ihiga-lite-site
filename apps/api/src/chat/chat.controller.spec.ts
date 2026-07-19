import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as path from "path";
import { ChatController } from "./chat.controller";
import { ChatOrchestratorService } from "./chat-orchestrator.service";
import { GroqService } from "../ai/groq.service";

const FIXTURES_DIR = path.join(__dirname, "..", "..", "test", "fixtures");

const FARMER_ID = "11111111-1111-4111-8111-111111111111";
const CONVERSATION_ID = "22222222-2222-4222-8222-222222222222";

function makeChatResponse(replyText: string) {
  return {
    conversationId: CONVERSATION_ID,
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
// Registers the same global ValidationPipe as main.ts/AppModule so DTO
// validation is actually exercised here too, not just in production.
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("POST /chat/voice transcribes the uploaded audio and hands it to handleMessage as a 'voice' message", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/voice")
      .field("conversationId", CONVERSATION_ID)
      .field("farmerId", FARMER_ID)
      .attach("audio", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(201);

    expect(groqService.transcribeAudio).toHaveBeenCalledTimes(1);
    expect(chatOrchestratorService.handleMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "plant maize now", messageType: "voice", conversationId: CONVERSATION_ID, farmerId: FARMER_ID }),
    );
    expect(response.body.transcribedText).toBe("plant maize now");
    expect(response.body.replyText).toBe("echo: plant maize now");
  });

  it("POST /chat/voice rejects when farmerId is missing", async () => {
    await request(app.getHttpServer())
      .post("/chat/voice")
      .attach("audio", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects when farmerId is not a valid UUID", async () => {
    await request(app.getHttpServer())
      .post("/chat/voice")
      .field("farmerId", "not-a-uuid")
      .attach("audio", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects an unexpected extra field instead of silently passing it through", async () => {
    await request(app.getHttpServer())
      .post("/chat/voice")
      .field("farmerId", FARMER_ID)
      .field("isAdmin", "true")
      .attach("audio", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects an unsupported audio mime type", async () => {
    await request(app.getHttpServer())
      .post("/chat/voice")
      .field("farmerId", FARMER_ID)
      .attach("audio", path.join(FIXTURES_DIR, "tiny.png")) // a real image, wrong field
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects a file whose declared mimetype doesn't match its real content (signature check)", async () => {
    // A real PNG, relabeled with an accepted audio Content-Type — passes the
    // mimetype allowlist but must fail the magic-byte check.
    await request(app.getHttpServer())
      .post("/chat/voice")
      .field("farmerId", FARMER_ID)
      .attach("audio", path.join(FIXTURES_DIR, "tiny.png"), { contentType: "audio/wav", filename: "fake.wav" })
      .expect(400);

    expect(groqService.transcribeAudio).not.toHaveBeenCalled();
  });

  it("POST /chat/voice rejects when no file is attached", async () => {
    await request(app.getHttpServer()).post("/chat/voice").field("farmerId", FARMER_ID).expect(400);
  });

  it("POST /chat/photo analyzes the uploaded image and passes the caption + mimetype through", async () => {
    const response = await request(app.getHttpServer())
      .post("/chat/photo")
      .field("farmerId", FARMER_ID)
      .field("caption", "What is wrong with these leaves?")
      .attach("image", path.join(FIXTURES_DIR, "tiny.png"))
      .expect(201);

    expect(chatOrchestratorService.handlePhotoMessage).toHaveBeenCalledWith(
      expect.objectContaining({ caption: "What is wrong with these leaves?", mimeType: "image/png", farmerId: FARMER_ID }),
    );
    expect(response.body.replyText).toContain("not fully certain");
  });

  it("POST /chat/photo rejects when farmerId is missing", async () => {
    await request(app.getHttpServer())
      .post("/chat/photo")
      .attach("image", path.join(FIXTURES_DIR, "tiny.png"))
      .expect(400);

    expect(chatOrchestratorService.handlePhotoMessage).not.toHaveBeenCalled();
  });

  it("POST /chat/photo rejects an unsupported image mime type", async () => {
    await request(app.getHttpServer())
      .post("/chat/photo")
      .field("farmerId", FARMER_ID)
      .attach("image", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "audio/webm" })
      .expect(400);

    expect(chatOrchestratorService.handlePhotoMessage).not.toHaveBeenCalled();
  });

  it("POST /chat/photo rejects a file whose declared mimetype doesn't match its real content (signature check)", async () => {
    // A real WebM file, relabeled with an accepted image Content-Type.
    await request(app.getHttpServer())
      .post("/chat/photo")
      .field("farmerId", FARMER_ID)
      .attach("image", path.join(FIXTURES_DIR, "tiny.webm"), { contentType: "image/png", filename: "fake.png" })
      .expect(400);

    expect(chatOrchestratorService.handlePhotoMessage).not.toHaveBeenCalled();
  });

  it("POST /chat/photo rejects when no file is attached", async () => {
    await request(app.getHttpServer()).post("/chat/photo").field("farmerId", FARMER_ID).expect(400);
  });
});
