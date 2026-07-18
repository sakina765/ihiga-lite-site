import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { maskPhoneNumber } from "../common/pii.util";

interface AfricasTalkingRecipient {
  status?: string;
  statusCode?: number;
  cost?: string;
  messageId?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Sends an SMS via Africa's Talking. Never throws: if credentials are
   * missing/placeholder, or a real send fails (unverified sandbox number,
   * account not funded, network error, etc.), this logs clearly and returns
   * normally — a single SMS failure must never crash the notification
   * scheduler that calls this for potentially many farmers in a loop.
   */
  async sendSms(to: string, message: string): Promise<void> {
    const apiKey = this.configService.get<string>("AFRICAS_TALKING_API_KEY");
    const username = this.configService.get<string>("AFRICAS_TALKING_USERNAME");
    const maskedTo = maskPhoneNumber(to);

    if (!apiKey || !username) {
      // Message content deliberately not logged — it's the farmer's data, not
      // needed to debug "why didn't this send", and the phone number is masked
      // for the same reason.
      this.logger.warn(`sendSms skipped — Africa's Talking not configured. Would have sent to ${maskedTo} (messageLength=${message.length}).`);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const africastalking = require("africastalking");
      const client = africastalking({ apiKey, username });
      const result = await client.SMS.send({ to: [to], message });
      // Africa's Talking's response echoes the phone number back in
      // Recipients[].number — pull out only the non-PII delivery fields
      // rather than logging the raw result object.
      const recipient: AfricasTalkingRecipient | undefined = result?.SMSMessageData?.Recipients?.[0];
      this.logger.log(
        `sendSms ok — to=${maskedTo} messageLength=${message.length}` +
          (recipient
            ? ` status=${recipient.status} statusCode=${recipient.statusCode} cost=${recipient.cost} messageId=${recipient.messageId}`
            : ""),
      );
    } catch (error) {
      this.logger.error(
        `sendSms failed — to=${maskedTo} messageLength=${message.length}: ${(error as Error).message}. ` +
          "Not rethrowing (log-and-skip by design).",
      );
    }
  }
}
