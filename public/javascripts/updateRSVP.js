document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".rsvp-button");

  buttons.forEach(button => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();

      const id = button.getAttribute("data-id");

      // Make the RSVP request
      const response = await fetch(`/posts/${id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (response.ok) {
        // Update the RSVP button text based on the response
        document.getElementById("rsvp-status").innerHTML = `${result.attending ? '❌' : '✔️'}`;

        // Remove both possible color classes
        button.classList.remove("rsvp-green", "rsvp-red");

        // Add the appropriate one based on attending status
        if (result.attending) {
          button.classList.add("rsvp-red");
        } else {
          button.classList.add("rsvp-green");
        }

        const attendeesList = document.querySelector("#attendees-modal .user-list");
        const noAttendeesMessage = document.querySelector("#attendees-modal .no-attendees-message");

        if (result.attending) {
          // If user is now attending, add them to the attendee list manually
          if (noAttendeesMessage) noAttendeesMessage.style.display = "none";

          // Check if they are already in the list (prevent duplicate)
          if (!attendeesList.querySelector(`[data-user-id="${CURRENT_USER.id}"]`)) {
            const attendeeItem = document.createElement("li");
            attendeeItem.classList.add("user-list-item");
            attendeeItem.setAttribute("data-user-id", CURRENT_USER.id); // helpful for future checks
            attendeeItem.onclick = () => window.location.href = `/${CURRENT_USER.username}`;

            attendeeItem.innerHTML = `
              <img src="/profile-picture/${CURRENT_USER.id}" alt="${CURRENT_USER.username}'s profile picture" class="user-avatar">
              <div class="user-info">
                <h3>${CURRENT_USER.name}</h3>
                <p>@${CURRENT_USER.username}</p>
              </div>
            `;

            attendeesList.appendChild(attendeeItem);
          }
        } else {
          // If user canceled RSVP, remove them from the attendee list
          const existingItem = attendeesList.querySelector(`[data-user-id="${CURRENT_USER.id}"]`);
          if (existingItem) {
            existingItem.remove();
          }

          // If no attendees left, show message
          if (attendeesList.children.length === 0 && noAttendeesMessage) {
            noAttendeesMessage.style.display = "block";
          }
        }
      }
    });
  });
});
