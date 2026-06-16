import { useEffect, useMemo, useState } from "react";
import { MAX_AVATAR_FILE_SIZE } from "../constants/profileConstants";
import { buildFormFromUser, formatDate } from "../utils/profile";


export default function useProfile({ user, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayEmail = user?.email || "No email available";
  const displayInitial = String(displayName).trim().charAt(0).toUpperCase() || "U";
  const joinedOn = useMemo(() => formatDate(user?.createdAt), [user?.createdAt]);
  const [form, setForm] = useState(() => buildFormFromUser(user));

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setForm(buildFormFromUser(user));
  }, [user, isEditing]);

  const previewName = useMemo(() => form.name || displayName, [form.name, displayName]);
  const previewInitial = useMemo(
    () => String(previewName).trim().charAt(0).toUpperCase() || displayInitial,
    [previewName, displayInitial],
  );

  function setFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleStartEdit() {
    setForm(buildFormFromUser(user));
    setFeedback(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setFeedback(null);
    setForm(buildFormFromUser(user));
  }

  function handleRemoveAvatar() {
    setForm((current) => ({ ...current, avatarDataUrl: "" }));
  }

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

  return {
    displayEmail,
    joinedOn,
    isEditing,
    feedback,
    form,
    previewName,
    previewInitial,
    setFormField,
    handleStartEdit,
    handleCancelEdit,
    handleRemoveAvatar,
    handleAvatarFileChange,
    handleSubmit,
  };
}