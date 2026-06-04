import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { COOKIE_REFRESH_TOKEN, JWT_ACCESS_EXPIRY } from "../utils/constants";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "fallback-access-secret-32-chars-long";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret-32-chars-long";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  /**
   * Hash password using bcryptjs
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare a raw password with a hashed password
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate an Access Token (short-lived)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: "182d",
    });
  }

  /**
   * Generate a Refresh Token (long-lived)
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: "360d",
    });
  }

  /**
   * Verify Access Token
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
  }

  /**
   * Verify Refresh Token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
  }

  /**
   * Get cookie options for setting access and refresh tokens
   */
  static getCookieOptions(
    type: "access" | "refresh",
    isSecure = process.env.NODE_ENV === "production",
  ) {
    const maxAge = type === "access" ? 150 * 24 * 3600 : 360 * 24 * 60 * 60; // 150 days vs 360 days

    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
      maxAge,
    };
  }
}
