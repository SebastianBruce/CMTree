// Only run on the notifications page
if (window.location.pathname === "/notifications") {
  window.addEventListener("DOMContentLoaded", () => {
    fetch("/notifications/mark-all-read", {
      method: "PUT"
    }).catch((err) => {
      // Fail silently
      console.error("Failed to mark notifications as read:", err);
    });
  });
}