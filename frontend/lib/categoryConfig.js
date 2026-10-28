export const CATEGORY_OPTIONS = [
  { value: "dining", label: "Dining Out", icon: "fas fa-utensils", color: "#f97316" },
  { value: "groceries", label: "Groceries", icon: "fas fa-shopping-basket", color: "#22c55e" },
  { value: "fruits", label: "Fruits", icon: "fas fa-apple-alt", color: "#ef4444" },
  { value: "snacks", label: "Snacks", icon: "fas fa-cookie-bite", color: "#d97706" },
  { value: "liquor", label: "Liquor & Spirits", icon: "fas fa-wine-glass-alt", color: "#9333ea" },
  { value: "juices", label: "Juices", icon: "fas fa-glass-whiskey", color: "#eab308" },
  { value: "beverages", label: "Non-Alcoholic Beverages", icon: "fas fa-mug-hot", color: "#14b8a6" },
  { value: "movies", label: "Movies", icon: "fas fa-film", color: "#db2777" },
  { value: "membership", label: "Membership", icon: "fas fa-id-card", color: "#6366f1" },
  { value: "hobbies", label: "Hobbies", icon: "fas fa-palette", color: "#f43f5e" },
  { value: "sports", label: "Sports & Recreation", icon: "fas fa-basketball-ball", color: "#ea580c" },
  { value: "rent", label: "Rent & Mortgage", icon: "fas fa-home", color: "#2563eb" },
  { value: "electronics", label: "Electronics", icon: "fas fa-tv", color: "#0061ff" },
  { value: "furniture", label: "Furniture & Decor", icon: "fas fa-couch", color: "#b45309" },
  { value: "maintenance", label: "Maintenance & Repairs", icon: "fas fa-tools", color: "#ff4f00" },
  { value: "supplies", label: "Household Supplies", icon: "fas fa-box-open", color: "#06b6d4" },
  { value: "pets", label: "Pets", icon: "fas fa-paw", color: "#65a30d" },
  { value: "services", label: "Services", icon: "fas fa-concierge-bell", color: "#8b5cf6" },
  { value: "childcare", label: "Childcare", icon: "fas fa-baby", color: "#f9a8d4" },
  { value: "clothing", label: "Clothing & Accessories", icon: "fas fa-tshirt", color: "#d946ef" },
  { value: "health", label: "Healthcare", icon: "fas fa-heartbeat", color: "#dc2626" },
  { value: "personal", label: "Personal Care", icon: "fas fa-shower", color: "#0ea5e9" },
  { value: "education", label: "Education", icon: "fas fa-graduation-cap", color: "#1d4ed8" },
  { value: "taxes", label: "Taxes", icon: "fas fa-receipt", color: "#047857" },
  { value: "insurance", label: "Insurance", icon: "fas fa-shield-alt", color: "#0f766e" },
  { value: "savings", label: "Savings", icon: "fas fa-piggy-bank", color: "#0d9488" },
  { value: "fuel", label: "Fuel", icon: "fas fa-gas-pump", color: "#b91c1c" },
  { value: "parking", label: "Parking", icon: "fas fa-parking", color: "#4f46e5" },
  { value: "cab", label: "Cab", icon: "fas fa-taxi", color: "#ca8a04" },
  { value: "flight", label: "Flight", icon: "fas fa-plane", color: "#0284c7" },
  { value: "bicycle", label: "Bicycle", icon: "fas fa-bicycle", color: "#16a34a" },
  { value: "bus", label: "Bus", icon: "fas fa-bus", color: "#c2410c" },
  { value: "metro", label: "Metro", icon: "fas fa-subway", color: "#98A1BC" },
  { value: "train", label: "Train", icon: "fas fa-train", color: "#346739" },
  { value: "electricity", label: "Electricity", icon: "fas fa-bolt", color: "#facc15" },
  { value: "water", label: "Water", icon: "fas fa-tint", color: "#3b82f6" },
  { value: "cleaning", label: "Cleaning", icon: "fas fa-broom", color: "#0891b2" },
  { value: "gas", label: "Gas", icon: "fas fa-burn", color: "#fb7185" },
  { value: "internet", label: "Internet & Cable", icon: "fas fa-wifi", color: "#4338ca" },
  { value: "phone", label: "Phone", icon: "fas fa-phone", color: "#15803d" },
  { value: "uncategorized", label: "Uncategorized", icon: "fas fa-question-circle", color: "#c2185b" },
];

const CATEGORY_OPTION_MAP = Object.fromEntries(
  CATEGORY_OPTIONS.map((option) => [option.value, option]),
);

export const CATEGORY_GROUPS = [
  { label: "Food", values: ["dining", "groceries", "fruits", "snacks"] },
  { label: "Drinks", values: ["liquor", "juices", "beverages"] },
  {
    label: "Entertainment",
    values: ["movies", "membership", "hobbies", "sports"],
  },
  {
    label: "Home",
    values: ["rent","electronics","furniture","maintenance","supplies","pets","services",],
  },
  {
    label: "Life",
    values: [
      "childcare",
      "clothing",
      "health",
      "personal",
      "education",
      "taxes",
      "insurance",
      "savings",
    ],
  },
  {
    label: "Transportation",
    values: [
      "fuel",
      "parking",
      "cab",
      "flight",
      "bicycle",
      "bus",
      "metro",
      "train",
    ],
  },
  {
    label: "Utilities",
    values: ["electricity", "water", "cleaning", "gas", "internet", "phone"],
  },
  { label: "Other", values: ["uncategorized"] },
].map((group) => ({
  label: group.label,
  options: group.values
    .map((value) => CATEGORY_OPTION_MAP[value])
    .filter(Boolean),
}));

export function getCategoryDisplay(category) {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category) || {
      value: category,
      label: category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : "Uncategorized",
      icon: "fas fa-circle",
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.uncategorized,
    }
  );
}
