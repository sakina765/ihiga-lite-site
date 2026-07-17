import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  private getClient(): any {
    const apiKey = this.configService.get<string>("AFRICAS_TALKING_API_KEY");
    const username = this.configService.get<string>("AFRICAS_TALKING_USERNAME");

    if (!apiKey || !username) {
      throw new Error(
        "SmsService is not configured: set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const africastalking = require("africastalking");
    return africastalking({ apiKey, username });
  }

  async sendSms(to: string, message: string): Promise<void> {
    this.logger.warn(`sendSms() not implemented yet. Would send to ${to}: ${message}`);
  }
}
