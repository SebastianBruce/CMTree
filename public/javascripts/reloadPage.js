window.addEventListener("pageshow", function(event) {
  // This reloads even if `persisted` is false but it's a history navigation
  if (performance.navigation.type === 2 || event.persisted) {
    window.location.reload();
  }
});