import prisma from "../../config/db.js";

const defaultPreferences = {
  reportingCurrency: "INR",
  timeZone: "Asia/Kolkata",
  dateFormat: "DD/MM/YYYY",
  language: "en",
};

export const fetchPreferences = async (userId) => {
  let preferences = await prisma.userPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if they don't exist.
  if (!preferences) {
    preferences = await prisma.userPreference.create({
      data: {
        userId,
        ...defaultPreferences,
      },
    });
  }

  return preferences;
};

export const updatePreferences = async (userId, data) => {
  return prisma.userPreference.upsert({
    where: { userId },
    create: {
      userId,
      ...defaultPreferences,
      ...data,
    },
    update: data,
  });
};