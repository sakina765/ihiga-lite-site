import { Logger } from "@nestjs/common";
import { SmsService } from "./sms.service";

const mockSend = jest.fn();
jest.mock("africastalking", () => {
  return jest.fn().mockImplementation(() => ({
    SMS: { send: mockSend },
  }));
});

describe("SmsService", () => {
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSend.mockReset();
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function makeService(configured: boolean) {
    const configService = {
      get: jest.fn((key: string) => {
        if (!configured) return undefined;
        return key === "AFRICAS_TALKING_API_KEY" ? "fake-key" : "sandbox";
      }),
    };
    return new SmsService(configService as any);
  }

  it("skips sending and never logs the raw phone number or message when credentials are missing", async () => {
    const service = makeService(false);

    await service.sendSms("+250788123456", "secret farmer message");

    expect(mockSend).not.toHaveBeenCalled();
    const loggedText = warnSpy.mock.calls[0][0] as string;
    expect(loggedText).not.toContain("+250788123456");
    expect(loggedText).not.toContain("secret farmer message");
    expect(loggedText).toContain("3456"); // masked, last 4 digits only
  });

  it("sends via Africa's Talking when configured, and never logs the raw phone number or message", async () => {
    const service = makeService(true);
    mockSend.mockResolvedValue({
      SMSMessageData: {
        Message: "Sent to 1/1",
        Recipients: [{ number: "+250788123456", status: "Success", statusCode: 101, cost: "RWF 14.0000", messageId: "abc" }],
      },
    });

    await service.sendSms("+250788123456", "secret farmer message");

    expect(mockSend).toHaveBeenCalledWith({ to: ["+250788123456"], message: "secret farmer message" });
    const loggedText = logSpy.mock.calls[0][0] as string;
    expect(loggedText).not.toContain("+250788123456");
    expect(loggedText).not.toContain("secret farmer message");
    expect(loggedText).toContain("3456");
    expect(loggedText).toContain("Success");
  });

  it("never throws when the send fails, and never logs the raw phone number", async () => {
    const service = makeService(true);
    mockSend.mockRejectedValue(new Error("network error"));

    await expect(service.sendSms("+250788123456", "secret farmer message")).resolves.toBeUndefined();

    const loggedText = errorSpy.mock.calls[0][0] as string;
    expect(loggedText).not.toContain("+250788123456");
    expect(loggedText).toContain("3456");
    expect(loggedText).toContain("network error");
  });
});
