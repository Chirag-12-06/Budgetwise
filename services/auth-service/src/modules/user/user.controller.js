import {
  fetchUserProfile,
  updateUserProfile,
} from "./user.service.js";

import asyncHandler from "../../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await fetchUserProfile(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.validated.body;

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name cannot be empty",
    });
  }

  const data = {};

  if (name !== undefined) data.name = name.trim();
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No profile fields provided",
    });
  }

  const user = await updateUserProfile(req.user.id, data);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});