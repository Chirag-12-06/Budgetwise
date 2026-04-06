import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  return secret || null;
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server auth is not configured" });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (_error) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const subject = typeof payload === "string" ? "" : payload?.sub;
    const userId = Number(subject);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
