import { FarmerRole } from "../farmers/entities/farmer.entity";

/** Deliberately minimal — no phone number or other PII in the token payload, since it's base64 (readable), not encrypted. */
export interface AdminJwtPayload {
  sub: string;
  role: FarmerRole;
}
