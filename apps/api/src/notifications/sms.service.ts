import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { maskPhoneNumber } from "../common/pii.util";

interface AfricasTalkingRecipient {
  status?: string;
  statusCode?: number;
  cost?: string;
  messageId?: string;
}

export type SmsSendOutcome = "sent" | "not_configured" | "failed";

/**
 * Everything the admin alerts log (Phase 6) needs to show real delivery
 * status without ever having logged raw PII to get it — these fields are the
 * exact same non-PII subset sendSms already pulled out of Africa's Talking's
 * response for its own log line, just returned to the caller instead of only
 * being logged.
 */
export interface SmsSendResult {
  outcome: SmsSendOutcome;
  providerStatus: string | null;
  providerStatusCode: number | null;
  providerCost: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
}

/**
 * Configured with Africa's Talking SANDBOX credentials — a "Success" result
 * here confirms the integration works, NOT that a real SMS reached a real
 * phone. The sandbox only reliably delivers to Airtel Kenya test numbers, so
 * a real Rwandan farmer today gets a logged "success" with nothing arriving
 * on their device. Going live needs an approved Sender ID from Africa's
 * Talking, which requires a registered business (Tax ID, Certificate of
 * Incorporation, rep ID) — not something this project has. See
 * DEPLOYMENT.md's "SMS Notifications — Current Status" for the full picture.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sends an SMS via Africa's Talking. Never throws: if credentials are
   * missing/placeholder, or a real send fails (unverified sandbox number,
   * account not funded, network error, etc.), this logs clearly and returns
   * a result describing what happened — a single SMS failure must never
   * crash the notification scheduler that calls this for potentially many
   * farmers in a loop.
   */
  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const apiKey = this.configService.get<string>("AFRICAS_TALKING_API_KEY");
    const username = this.configService.get<string>("AFRICAS_TALKING_USERNAME");
    const maskedTo = maskPhoneNumber(to);

    if (!apiKey || !username) {
      // Message content deliberately not logged — it's the farmer's data, not
      // needed to debug "why didn't this send", and the phone number is masked
      // for the same reason.
      this.logger.warn(`sendSms skipped — Africa's Talking not configured. Would have sent to ${maskedTo} (messageLength=${message.length}).`);
      return { outcome: "not_configured", providerStatus: null, providerStatusCode: null, providerCost: null, providerMessageId: null, errorMessage: null };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const africastalking = require("africastalking");
      const client = africastalking({ apiKey, username });
      const result = await client.SMS.send({ to: [to], message });
      // Africa's Talking's response echoes the phone number back in
      // Recipients[].number — pull out only the non-PII delivery fields
      // rather than logging (or returning) the raw result object.
      const recipient: AfricasTalkingRecipient | undefined = result?.SMSMessageData?.Recipients?.[0];
      this.logger.log(
        `sendSms ok — to=${maskedTo} messageLength=${message.length}` +
          (recipient
            ? ` status=${recipient.status} statusCode=${recipient.statusCode} cost=${recipient.cost} messageId=${recipient.messageId}`
            : ""),
      );
      return {
        outcome: "sent",
        providerStatus: recipient?.status ?? null,
        providerStatusCode: recipient?.statusCode ?? null,
        providerCost: recipient?.cost ?? null,
        providerMessageId: recipient?.messageId ?? null,
        errorMessage: null,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`sendSms failed — to=${maskedTo} messageLength=${message.length}: ${errorMessage}. Not rethrowing (log-and-skip by design).`);
      return { outcome: "failed", providerStatus: null, providerStatusCode: null, providerCost: null, providerMessageId: null, errorMessage };
    }
  }
}
