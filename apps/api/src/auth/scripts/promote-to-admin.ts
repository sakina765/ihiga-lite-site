import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppModule } from "../../app.module";
import { Farmer } from "../../farmers/entities/farmer.entity";
import { normalizePhoneNumber } from "../../farmers/phone-number.util";
import { hashPassword } from "../password.util";
import { maskPhoneNumber } from "../../common/pii.util";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Grants (or re-passwords) an admin account. Deliberately a CLI script, not
 * an API endpoint — there is no self-service admin signup by design (see
 * README's Phase 1 notes on admin auth), so granting the role is a manual,
 * out-of-band action taken by whoever already has server/deploy access.
 *
 * Usage (from apps/api):
 *   pnpm promote-to-admin +250788123456 "a strong password"
 *
 * Idempotent: if the phone number already belongs to a farmer, that row is
 * promoted in place (role -> "admin", password set/replaced) rather than
 * creating a duplicate. If it doesn't exist yet, a new admin-only Farmer row
 * is created — admins don't need to go through the farmer onboarding chat
 * flow first.
 */
async function run(): Promise<void> {
  const [rawPhoneNumber, password] = process.argv.slice(2);

  if (!rawPhoneNumber || !password) {
    console.error('Usage: pnpm promote-to-admin "<phoneNumber>" "<password>"');
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });

  try {
    const farmerRepository = app.get<Repository<Farmer>>(getRepositoryToken(Farmer));

    let farmer = await farmerRepository.findOne({ where: { phoneNumber } });
    const passwordHash = await hashPassword(password);

    if (farmer) {
      farmer.role = "admin";
      farmer.passwordHash = passwordHash;
    } else {
      farmer = farmerRepository.create({
        phoneNumber,
        role: "admin",
        passwordHash,
        district: null,
        preferredLanguage: null,
        lastNotifiedStageId: null,
        lastNotifiedWeatherAlertDate: null,
        farmLatitude: null,
        farmLongitude: null,
        sectorId: null,
        villageText: null,
        resolvedLatitude: null,
        resolvedLongitude: null,
      });
    }

    await farmerRepository.save(farmer);
    console.log(`Promoted ${maskPhoneNumber(phoneNumber)} to admin (farmerId=${farmer.id}).`);
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("promote-to-admin failed:", error);
    process.exit(1);
  });
