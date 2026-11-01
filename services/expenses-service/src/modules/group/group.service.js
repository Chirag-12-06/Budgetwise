import prisma from "../../config/db.js";

export const fetchCategoryGroups = async () => {
  return prisma.expenseGroup.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
