const openAttendeesModalBtn = document.getElementById('open-attendees-modal');
const attendeesModal = document.getElementById('attendees-modal');

// Open modal on click
openAttendeesModalBtn.addEventListener('click', async (event) => {
  event.preventDefault();

  // Show the modal
  attendeesModal.classList.remove('hidden');

  // Push new state to history
  history.pushState({ modal: 'attendees' }, '', `${window.location.pathname}?attendees=1`);

  const postId = document.querySelector(".rsvp-button")?.getAttribute("data-id");

  if (postId) {
    try {
      const attendeesResponse = await fetch(`/posts/${postId}/attendees`);
      const attendeesData = await attendeesResponse.json();

      const attendeesList = attendeesModal.querySelector(".user-list");
      const noAttendeesMessage = attendeesModal.querySelector(".no-attendees-message");

      if (attendeesList) {
        attendeesList.innerHTML = ''; // Clear old list

        if (attendeesData.length) {
          noAttendeesMessage.style.display = 'none';
          attendeesData.forEach(attendee => {
            const attendeeItem = document.createElement("li");
            attendeeItem.classList.add("user-list-item");
            attendeeItem.onclick = () => window.location.href = `/${attendee.username}`;

            attendeeItem.innerHTML = `
              <img src="/profile-picture/${attendee._id}" alt="${attendee.username}'s profile picture" class="user-avatar">
              <div class="user-info">
                <h3>${attendee.name}</h3>
                <p>@${attendee.username}</p>
              </div>
            `;

            attendeesList.appendChild(attendeeItem);
          });
        } else {
          noAttendeesMessage.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendees', error);
    }
  }
});

// Close modal when clicking outside
attendeesModal.addEventListener('click', (event) => {
  if (event.target === attendeesModal) {
    attendeesModal.classList.add('hidden');
    history.back(); // Go back one history entry
  }
});

// Handle back/forward browser buttons
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.modal === 'attendees') {
    attendeesModal.classList.remove('hidden');
  } else {
    attendeesModal.classList.add('hidden');
  }
});

// Open the modal automatically if URL has ?attendees=1 (e.g. on page load after refresh)
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('attendees')) {
    attendeesModal.classList.remove('hidden');
  }
});
