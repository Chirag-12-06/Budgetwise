import api from "./api";

export async function trainExpenseModel() {
  return api.post("/train-model", {});
}

export async function predictExpenseCategory({ title, amount }) {
  return api.post("/predict-category", {
    title,
    amount,
  });
}
