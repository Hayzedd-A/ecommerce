const GUEST_ID_KEY = "guest_id";

export const getGuestId = (): string => {
  if (typeof window === "undefined") return "";

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

export const clearGuestId = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_ID_KEY);
  }
};
