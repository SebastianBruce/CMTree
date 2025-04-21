function togglePassword(inputId, iconElement) {
  // Fallback for login page: no arguments provided
  if (!inputId || !iconElement) {
    const input = document.getElementById("password");
    const icon = document.querySelector(".toggle-password");

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.textContent = isPassword ? "🙈" : "👁️";
    return;
  }

  // Register page: use passed ID and icon
  const input = document.getElementById(inputId);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  iconElement.textContent = isPassword ? "🙈" : "👁️";
}
