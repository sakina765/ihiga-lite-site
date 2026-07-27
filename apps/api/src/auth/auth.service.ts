import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Farmer } from "../farmers/entities/farmer.entity";
import { normalizePhoneNumber } from "../farmers/phone-number.util";
import { verifyPassword } from "./password.util";
import { AdminJwtPayload } from "./admin-jwt-payload.type";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Farmer) private readonly farmerRepository: Repository<Farmer>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Returns the matching admin Farmer row, or null for any failure reason —
   * unknown phone number, wrong password, a real farmer account that isn't an
   * admin, or a phone number that doesn't even parse. Deliberately collapsed
   * to one outcome (same anti-enumeration principle used elsewhere in this
   * codebase, e.g. FarmersService.getPreferredLanguage) so a login attempt
   * can't be used to probe which phone numbers have admin accounts.
   */
  async validateAdminCredentials(phoneNumber: string, password: string): Promise<Farmer | null> {
    let normalized: string;
    try {
      normalized = normalizePhoneNumber(phoneNumber);
    } catch {
      return null;
    }

    const farmer = await this.farmerRepository.findOne({ where: { phoneNumber: normalized, role: "admin" } });
    if (!farmer || !farmer.passwordHash) {
      return null;
    }

    const matches = await verifyPassword(password, farmer.passwordHash);
    return matches ? farmer : null;
  }

  issueAdminToken(farmer: Farmer): string {
    const payload: AdminJwtPayload = { sub: farmer.id, role: farmer.role };
    return this.jwtService.sign(payload);
  }
}
