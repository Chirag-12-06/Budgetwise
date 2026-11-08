import Button from "../components/ui/button";
import PanelCard from "../components/ui/panelCard";
import useProfile from "../hooks/profile/useProfile";
import { formatCurrency } from "../utils/currency";
import usePreferences from "../hooks/profile/usePreferences";
import { useState } from "react";

import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../constants/preferences";

const fieldLabelClasses = "grid gap-2";
const fieldTextClasses = "text-[0.92rem] font-semibold";
const fieldInputClasses =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const primaryButtonClasses =
  "rounded-md border-0 bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70";
const dangerTextButtonClasses =
  "text-sm font-semibold text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";

export default function ProfilePage({
  user,
  expenses = [],
  totalSpent = 0,
  monthSpent = 0,
  onUpdateProfile,
  updatingProfile = false,
  showStatus,
}) {
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const {
    preferences,
    loading: loadingPreferences,
    saving: savingPreferences,
    setPreference,
    savePreferences,
  } = usePreferences(showStatus);

  const reportingCurrency = preferences.reportingCurrency;

  const trackedCategories = new Set(
    expenses.map((expense) => expense?.category || "uncategorized"),
  ).size;
  const averageExpense = expenses.length ? totalSpent / expenses.length : 0;
  const {
    displayEmail,
    joinedOn,
    isEditing,
    form,
    previewName,
    previewInitial,
    setFormField,
    handleStartEdit,
    handleCancelEdit,
    handleRemoveAvatar,
    handleAvatarFileChange,
    handleSubmit,
  } = useProfile({ user, onUpdateProfile, showStatus });

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {previewName}
            </h2>
            {!isEditing ? (
              <Button
                variant="outline"
                className="px-3 py-1.5 text-xs sm:text-sm"
                onClick={handleStartEdit}
              >
                Edit Profile
              </Button>
            ) : null}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {form.email || displayEmail}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Member since {joinedOn}
          </p>
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
                  onChange={(event) => setFormField("name", event.target.value)}
                  required
                />
              </label>

              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Email</span>
                <input
                  className={fieldInputClasses}
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setFormField("email", event.target.value)
                  }
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
              <span className="text-xs text-gray-500 dark:text-gray-300">
                PNG/JPG up to 2 MB.
              </span>
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
                  onClick={handleRemoveAvatar}
                >
                  Remove photo
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={handleCancelEdit}
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
        ) : null}
      </PanelCard>

      <PanelCard className="grid gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending Snapshot
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              Total Spending
            </p>
            <p className="mt-1 text-lg font-bold">
              {formatCurrency(totalSpent, reportingCurrency)}
            </p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              This Month
            </p>
            <p className="mt-1 text-lg font-bold">
              {formatCurrency(monthSpent, reportingCurrency)}
            </p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              Entries
            </p>
            <p className="mt-1 text-lg font-bold">{expenses.length}</p>
          </article>
          <article className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
              Avg Expense
            </p>
            <p className="mt-1 text-lg font-bold">
              {formatCurrency(averageExpense, reportingCurrency)}
            </p>
          </article>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-300">
          You are currently tracking {trackedCategories} categories across your
          expenses.
        </p>
      </PanelCard>

      <PanelCard className="grid gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Regional Preferences
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Customize how BudgetWise displays your financial information.
            </p>
          </div>

          {!loadingPreferences && (
            <Button
              variant="outline"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              onClick={() => setIsEditingPreferences((previous) => !previous)}
            >
              {isEditingPreferences ? "Cancel" : "Edit"}
            </Button>
          )}
        </div>

        {loadingPreferences ? (
          <p className="text-sm text-gray-500">Loading preferences...</p>
        ) : isEditingPreferences ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Currency</span>
                <select
                  className={fieldInputClasses}
                  value={preferences.reportingCurrency}
                  onChange={(event) =>
                    setPreference("reportingCurrency", event.target.value)
                  }
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Timezone</span>
                <select
                  className={fieldInputClasses}
                  value={preferences.timeZone}
                  onChange={(event) =>
                    setPreference("timeZone", event.target.value)
                  }
                >
                  {TIMEZONE_OPTIONS.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Language</span>
                <select
                  className={fieldInputClasses}
                  value={preferences.language}
                  onChange={(event) =>
                    setPreference("language", event.target.value)
                  }
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldLabelClasses}>
                <span className={fieldTextClasses}>Date Format</span>
                <select
                  className={fieldInputClasses}
                  value={preferences.dateFormat}
                  onChange={(event) =>
                    setPreference("dateFormat", event.target.value)
                  }
                >
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="plain"
                onClick={() => setIsEditingPreferences(false)}
              >
                Cancel
              </Button>

              <Button
                variant="plain"
                className={primaryButtonClasses}
                onClick={async () => {
                  await savePreferences();
                  setIsEditingPreferences(false);
                }}
                disabled={savingPreferences}
              >
                {savingPreferences ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                label: "Currency",
                value: preferences.reportingCurrency,
              },
              {
                label: "Timezone",
                value: preferences.timeZone,
              },
              {
                label: "Language",
                value:
                  LANGUAGE_OPTIONS.find(
                    (option) => option.value === preferences.language,
                  )?.label || preferences.language,
              },
              {
                label: "Date Format",
                value: preferences.dateFormat,
              },
            ].map((item) => (
              <div key={item.label} className="grid gap-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </PanelCard>
    </section>
  );
}
