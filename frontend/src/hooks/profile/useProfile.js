import { useEffect, useState } from "react";
import { MAX_AVATAR_FILE_SIZE } from "../../constants/profileConstants";
import { buildFormFromUser, formatDate } from "../../utils/profile";

export default function useProfile({ user, onUpdateProfile, showStatus }) {
  const [isEditing, setIsEditing] = useState(false);
  const displayName = user?.name || user?.email || "Budgetwise user";
  const displayEmail = user?.email || "No email available";
  const joinedOn = formatDate(user?.createdAt);
  const [form, setForm] = useState(() => buildFormFromUser(user));
  
  function setFormField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(buildFormFromUser(user));
  }

  useEffect(() => {
    if (isEditing) {
      return;
    }

    resetForm();
  }, [user, isEditing]);

  const previewName = form.name || displayName;
  const previewInitial = previewName.charAt(0).toUpperCase();

  function handleStartEdit() {
    setIsEditing(true);
    resetForm();
  }

  function handleCancelEdit() {
    setIsEditing(false);
    resetForm();
  }

  function handleRemoveAvatar() {
      setForm((current) => ({ ...current, avatarDataUrl: "" }));
    }

    function validateAvatar(file) {
    if (!file.type.startsWith("image/")) {
      return "Please choose an image file.";
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      return "Please choose an image smaller than 2 MB.";
    }

    return null;
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateAvatar(file);
    if (validationError) {
      showStatus(validationError, "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarDataUrl = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, avatarDataUrl }));
      showStatus("Avatar updated successfully.", "success");
    };
    event.target.value = "";
    reader.onerror = () => {
      showStatus("Unable to read image file.", "error");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      showStatus("Name and email are required.", "error");
      return;
    }

    const result = await onUpdateProfile({
      name,
      email,
      avatarDataUrl: form.avatarDataUrl,
    });

    if (!result?.ok) {
      showStatus(result?.message || "Unable to update profile.", "error");
      return;
    }

    showStatus("Profile updated successfully.", "success");
    setIsEditing(false);
  }

  return {
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
  };
}