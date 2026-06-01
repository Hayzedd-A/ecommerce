import { NextRequest } from "next/server";
import { COOKIE_ACCESS_TOKEN } from "../utils/constants";
import { AuthService } from "../services/auth.service";

export interface Identity {
  userId?: string;
  guestId?: string;
  role?: string;
}

export const getIdentity = (req: NextRequest): Identity => {
  const identity: Identity = {};

  // Check for user token
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  if (token) {
    try {
      const payload = AuthService.verifyAccessToken(token);
      identity.userId = payload.id;
      identity.role = payload.role;
    } catch {
      // Invalid token, ignore
    }
  }

  // Check for guest ID header
  const guestId = req.headers.get("x-guest-id");
  if (guestId) {
    identity.guestId = guestId;
  }

  return identity;
};
