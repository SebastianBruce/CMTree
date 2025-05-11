const textarea = document.getElementById('reply-textarea');

textarea.addEventListener('input', function() {
  this.style.height = 'auto'; // Reset the height
  this.style.height = (this.scrollHeight) + 'px'; // Set it to the scrollHeight
});