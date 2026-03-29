import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let userId = Number(token);

    // Support both the older plain user-id token and the newer JWT token.
    if (Number.isNaN(userId)) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let payload;
      try {
        payload = jwt.verify(token, jwtSecret);
      } catch (_error) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      userId = Number(payload.sub);
    }

    if (Number.isNaN(userId)) {
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
