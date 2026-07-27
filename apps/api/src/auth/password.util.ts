import * as bcrypt from "bcryptjs";

const PASSWORD_HASH_ROUNDS = 12;

/** Shared by AuthService (verifying a login attempt) and the promote-to-admin CLI script (setting an initial password), so hashing/verifying can never drift out of sync. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
