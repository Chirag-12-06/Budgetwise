import prisma from "../../config/db.js";

export const fetchCategories = async () => {
  return prisma.expenseCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
