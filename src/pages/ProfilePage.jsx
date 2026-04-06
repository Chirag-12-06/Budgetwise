import { useEffect, useMemo, useState } from "react";
import Button from "../components/button";
import PanelCard from "../components/panelCard";
import { formatCurrency } from "../lib/api";

const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";
const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";
const dangerTextButtonClasses =
  "text-sm font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;

function formatDate(value) {
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

export default function ProfilePage({
  user,
  expenses = [],
  totalSpent = 0,
  monthSpent = 0,
  onUpdateProfile,
  updatingProfile = false,
}) {
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayEmail = user?.email || "No email available";
  const displayInitial = String(displayName).trim().charAt(0).toUpperCase() || "U";
  const joinedOn = formatDate(user?.createdAt);
  const trackedCategories = new Set(expenses.map((expense) => expense?.category || "uncategorized")).size;
  const averageExpense = expenses.length ? totalSpent / expenses.length : 0;
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatarDataUrl: user?.avatarDataUrl || "",
  });

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      avatarDataUrl: user?.avatarDataUrl || "",
    });
  }, [user, isEditing]);

  const previewName = useMemo(() => form.name || displayName, [form.name, displayName]);
  const previewInitial = useMemo(
    () => String(previewName).trim().charAt(0).toUpperCase() || displayInitial,
    [previewName, displayInitial],
  );

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Please choose an image file." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setFeedback({ type: "error", message: "Please choose an image smaller than 2 MB." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarDataUrl = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, avatarDataUrl }));
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setFeedback({ type: "error", message: "Name and email are required." });
      return;
    }

    if (!onUpdateProfile) {
      setFeedback({ type: "error", message: "Profile update is unavailable right now." });
      return;
    }

    const result = await onUpdateProfile({
      name,
      email,
      avatarDataUrl: form.avatarDataUrl,
    });

    if (!result?.ok) {
      setFeedback({ type: "error", message: result?.message || "Unable to update profile." });
      return;
    }

    setFeedback({ type: "success", message: "Profile updated successfully." });
    setIsEditing(false);
  }

  return (
    <section className="grid gap-4">
      <PanelCard className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center justify-center">
          {form.avatarDataUrl ? (
            <img
              src={form.avatarDataUrl}
              alt={`${previewName} profile`}
              className="h-24 w-24 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600"
            />
          ) : (
            <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-3xl font-bold text-white">
              {previewInitial}
            </span>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{previewName}</h2>
            {!isEditing ? (
              <Button variant="outline" className="px-3 py-1.5 text-xs sm:text-sm" onClick={() => {
                setForm({
                  name: user?.name || "",
                  email: user?.email || "",
                  avatarDataUrl: user?.avatarDataUrl || "",
                });
                setFeedback(null);
                setIsEditing(true);
              }}>
                Edit Profile
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300">{form.email || displayEmail}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Member since {joinedOn}</p>
        </div>

        {isEditing ? (
          <form className="grid gap-4 sm:col-span-2" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Name</span>
                <input
                  className={fieldInputClasses}
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Email</span>
                <input
                  className={fieldInputClasses}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
            </div>

            <label className={fieldLabelClasses}>
              <span className={fieldTextClasses}>Profile Photo (optional)</span>
              <input
                className={`${fieldInputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700`}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
              <span className="text-xs text-gray-500 dark:text-gray-300">PNG/JPG up to 2 MB.</span>
            </label>

            {form.avatarDataUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={form.avatarDataUrl}
                  alt="Profile preview"
                  className="h-14 w-14 rounded-full border border-gray-300 object-cover dark:border-gray-600"
                />
                <Button
                  variant="plain"
                  className={dangerTextButtonClasses}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, avatarDataUrl: "" }))}
                >
                  Remove photo
                </Button>
              </div>
            ) : null}

            {feedback ? (
              <p className={`text-sm font-semibold ${feedback.type === "error" ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
                {feedback.message}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFeedback(null);
                  setForm({
                    name: user?.name || "",
                    email: user?.email || "",
                    avatarDataUrl: user?.avatarDataUrl || "",
                  });
                }}
                disabled={updatingProfile}
              >
                Cancel
              </Button>
              <Button
                variant="plain"
                className={primaryButtonClasses}
                type="submit"
                disabled={updatingProfile}
              >
                {updatingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : feedback ? (
          <p className={`sm:col-span-2 text-sm font-semibold ${feedback.type === "error" ? "text-red-600 dark:text-red-300" : "text-emerald-600 dark:text-emerald-300"}`}>
            {feedback.message}
          </p>
        ) : null}
      </PanelCard>

      <PanelCard className="grid gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Spending Snapshot</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">Total Spending</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(totalSpent)}</p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">This Month</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(monthSpent)}</p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">Entries</p>
            <p className="mt-1 text-lg font-bold">{expenses.length}</p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">Avg Expense</p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(averageExpense)}</p>
          </article>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-300">
          You are currently tracking {trackedCategories} categories across your expenses.
        </p>
      </PanelCard>
    </section>
  );
}
