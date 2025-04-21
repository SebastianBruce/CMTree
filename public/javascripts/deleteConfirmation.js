const openModalBtn = document.getElementById('open-delete-modal');
const modal = document.getElementById('delete-modal');
const cancelBtn = document.getElementById('cancel-delete');
const confirmBtn = document.getElementById('confirm-delete');
const form = document.getElementById('delete-form');

openModalBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

confirmBtn.addEventListener('click', () => {
  form.submit();
});