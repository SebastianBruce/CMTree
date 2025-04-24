document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".like-btn");

  buttons.forEach(button => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();

      const id = button.getAttribute("data-id");

      const response = await fetch(`/posts/${id}/like`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
      });

      const result = await response.json();
      if (response.ok) {
        button.querySelector(".like-count").textContent = result.likesCount;
        button.innerHTML = `${result.liked ? '❤️' : '🤍'} <span class="like-count">${result.likesCount}</span>`;
      }
    });
  });
});