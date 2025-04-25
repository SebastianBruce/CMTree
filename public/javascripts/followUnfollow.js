document.addEventListener("DOMContentLoaded", function() {
  const followBtn = document.querySelector(".follow-form button");

  if (followBtn) {
    followBtn.addEventListener("click", function() {
      const isFollowing = followBtn.getAttribute("data-following") === 'true';
      const userId = followBtn.getAttribute("data-user-id");

      if (!followBtn.classList.contains("not-logged-in")) {
        const url = isFollowing ? `/unfollow/${userId}` : `/follow/${userId}`;
        
        // Send AJAX request to follow/unfollow
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update the button text based on the follow/unfollow state
            followBtn.textContent = isFollowing ? 'Follow' : 'Unfollow';
            followBtn.setAttribute("data-following", !isFollowing);
            
            // Update follower count dynamically
            const followersCountElem = document.querySelector('.follow-stats p a[href*="followers"]');
            const followersCount = parseInt(followersCountElem.textContent) || 0;
            followersCountElem.textContent = `${isFollowing ? followersCount - 1 : followersCount + 1} Followers`;

            // Optionally, you can change the link text to reflect the updated count
          } else {
            alert('Something went wrong. Please try again.');
          }
        })
        .catch(error => {
          console.error("Error:", error);
          alert('An error occurred. Please try again.');
        });
      } else {
        // If the user is not logged in, redirect them to the login page
        window.location.href = '/login';
      }
    });
  }
});