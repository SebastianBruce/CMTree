const openDeleteModalBtn = document.getElementById('open-delete-modal');
const deleteModal = document.getElementById('delete-modal');
const cancelBtn = document.getElementById('cancel-delete');
const confirmBtn = document.getElementById('confirm-delete');
const form = document.getElementById('delete-form');

if (openDeleteModalBtn && deleteModal && cancelBtn && confirmBtn && form) {
  // Open modal on click of delete button
  openDeleteModalBtn.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting immediately
    deleteModal.classList.remove('hidden'); // Show the delete confirmation modal
  });

  // Close modal when Cancel is clicked
  cancelBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden'); // Hide the modal when Cancel is clicked
  });

  // Submit the form when confirmed
  confirmBtn.addEventListener('click', () => {
    form.submit(); // Submit the form to delete the post
  });
}