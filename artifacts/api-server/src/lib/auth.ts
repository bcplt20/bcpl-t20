import jwt from "jsonwebtoken";

// Never sign real player tokens with the well-known dev fallback in production —
// fail fast at boot instead (prod env template sets JWT_SECRET explicitly).
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

const JWT_SECRET = process.env.JWT_SECRET || "bcpl-dev-secret-CHANGE-IN-PROD";
const JWT_EXPIRY = "30d";

export interface JwtPayload {
  userId: string;
  phone: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
