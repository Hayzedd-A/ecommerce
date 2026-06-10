import { NextRequest } from "next/server";
import { COOKIE_ACCESS_TOKEN } from "../utils/constants";
import { AuthService } from "../services/auth.service";
import { IUser } from "../types";
import dbConnect from "../db/connect";
import { Guest } from "../db/models";

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

interface IUserResponse {
  _id?: string;
  email?: string;
  role?: string;
  userModel?: "User" | "Guest";
}

export const getRequestUser = async (
  req: NextRequest,
): Promise<IUserResponse> => {
  const token = req.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  const user: IUserResponse = {
    _id: undefined,
    email: undefined,
    role: "customer",
    userModel: "User",
  };
  if (token) {
    try {
      const payload = AuthService.verifyAccessToken(token);
      user._id = payload.id;
      user.email = payload.email;
      user.role = payload.role === "admin" ? "admin" : "customer";
    } catch {
      // Invalid token, ignore
    }
  } else {
    const guestId = req.headers.get("x-guest-id");
    if (guestId) {
      await dbConnect();
      const guest = await Guest.findOne({ guestId });
      if (guest) {
        user._id = guest._id.toString();
        user.email = guest.email;
        user.userModel = "Guest";
        return user;
      }
    }
  }
  return user;
};
