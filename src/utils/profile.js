export function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


export function buildFormFromUser(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    avatarDataUrl: user?.avatarDataUrl || "",
  };
}

