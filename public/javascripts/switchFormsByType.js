document.addEventListener("DOMContentLoaded", function () {
  const typeSelect = document.getElementById("type");
  const titleInput = document.getElementById("title");
  const titleGroup = document.getElementById("title-group");
  const descriptionGroup = document.getElementById("description-group");
  const descriptionTextarea = descriptionGroup.querySelector("textarea");
  const eventDateGroup = document.getElementById("event-date-group");
  const eventDateInput = document.getElementById("eventDate");

  function toggleFields() {
    const type = typeSelect ? typeSelect.value : ""; // In case the typeSelect is not present for editing.

    // Title
    if (type === "update") {
      titleGroup.style.display = "none";
      titleInput.removeAttribute("required");
    } else {
      titleGroup.style.display = "block";
      titleInput.setAttribute("required", "true");
    }

    // Description
    if (type === "update") {
      descriptionGroup.style.display = "block";
      descriptionTextarea.placeholder = "Post an update.";
      descriptionGroup.querySelector("label").textContent = "Update";
      eventDateGroup.style.display = "none";
      eventDateInput.removeAttribute("required");
    } else if (type === "blog") {
      descriptionGroup.style.display = "block";
      descriptionTextarea.placeholder = "Your blog content.";
      descriptionGroup.querySelector("label").textContent = "Body";
      eventDateGroup.style.display = "none";
      eventDateInput.removeAttribute("required");
    } else if (type === "event") {
      descriptionGroup.style.display = "block";
      descriptionTextarea.placeholder = "Your event details.";
      descriptionGroup.querySelector("label").textContent = "Details";
      eventDateGroup.style.display = "block";
      eventDateInput.setAttribute("required", "true");
    } else {
      descriptionGroup.style.display = "none";
      eventDateGroup.style.display = "none";
    }
  }

  // Initial check (whether it's a new post or editing)
  toggleFields();

  // Update fields on change (for new post creation)
  if (typeSelect) {
    typeSelect.addEventListener("change", toggleFields);
  }
});
