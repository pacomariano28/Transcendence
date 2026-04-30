import bcrypt from "bcryptjs";

// Number of salt rounds for bcrypt hashing. Higher values increase security but also increase computation time.
const SALT_ROUNDS = 12;

/**
 * @brief Hashes a plain text password using bcrypt.
 *
 * @description
 * This function takes a plain text password as input and returns its bcrypt hash. Bcrypt is a widely used password hashing function that incorporates a salt to protect against rainbow table attacks and is computationally intensive to defend against brute-force attacks. The SALT_ROUNDS constant determines the cost factor of the hashing process, with higher values providing stronger security at the cost of increased computation time.
 * @param plain The plain text password to be hashed.
 * @returns A promise that resolves to the bcrypt hash of the provided password.
 *
 * @example
 * const plainPassword = "my-secure-password";
 * const hashedPassword = await hashPassword(plainPassword);
 * console.log("Hashed Password:", hashedPassword);
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * @brief Verifies a plain text password against its bcrypt hash.
 *
 * @description
 * This function takes a plain text password and its corresponding bcrypt hash as inputs and returns a promise that resolves to a boolean indicating whether the password matches the hash.
 * @param plain The plain text password to be verified.
 * @param hash The bcrypt hash to compare against.
 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
 *
 * @example
 * const plainPassword = "my-secure-password";
 * const hashedPassword = await hashPassword(plainPassword);
 * const isMatch = await verifyPassword(plainPassword, hashedPassword);
 * console.log("Password matches:", isMatch);
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
