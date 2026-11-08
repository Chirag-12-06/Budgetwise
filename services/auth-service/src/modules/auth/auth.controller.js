import { registerUser, loginUser } from "./auth.service.js";

import asyncHandler from "../../utils/asyncHandler.js";

import { sendPasswordResetEmail } from "../../utils/email.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.validated.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const { user, token } = await loginUser(
    email.trim().toLowerCase(),
    password,
  );

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal whether the email exists
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");

      // Store only the hashed token
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const resetLink =
        `${process.env.CLIENT_URL}/reset-password/${token}`;

      // Invalidate previous unused reset tokens
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail(email, resetLink);
    }

    return res.json({
      message: "If the account exists, reset instructions have been sent.",
    });
  } catch (error) {
    logError("Forgot password error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
