import { MAX_AVATAR_FILE_SIZE } from "../constants/profileConstants";

export default function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setSignupForm((current) => ({ ...current, avatarDataUrl: "" }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      window.alert("Please choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const avatarDataUrl = typeof reader.result === "string" ? reader.result : "";
      setSignupForm((current) => ({ ...current, avatarDataUrl }));
    };
    reader.readAsDataURL(file);
  }