document.addEventListener('DOMContentLoaded', function () {
  const menuButton = document.querySelector('.menu-button');
  const menuDropdown = document.querySelector('.menu-dropdown');

  if (menuButton && menuDropdown) {
    menuButton.addEventListener('click', function (e) {
      e.stopPropagation();
      menuDropdown.classList.toggle('hidden');
    });

    // Hide the menu if clicking outside
    document.addEventListener('click', function () {
      menuDropdown.classList.add('hidden');
    });
  }
});