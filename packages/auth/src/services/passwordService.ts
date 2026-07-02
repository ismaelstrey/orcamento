import bcrypt from "bcrypt";
import { env } from "@orcamento/shared";

/**
 * Gera o hash de senha com os rounds definidos em ambiente.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compara senha em texto puro com o hash persistido.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
