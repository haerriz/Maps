// Chat Functions - Global functions for AI chat functionality

function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input?.value?.trim();
  
  if (message && window.chatManager) {
    window.chatManager.sendMessage(message);
    input.value = '';
  }
}

// Fix #5: was calling sendMessage(message) which ignores the argument;
// sendQuickMessage sets the input value then sends it properly.
function sendQuickMessage(message) {
  if (window.chatManager) {
    window.chatManager.sendQuickMessage(message);
  }
}

// Fix #6: Enter key listener removed — ChatManager.setupEventListeners() already
// attaches an Enter listener to #chatInput. Adding a second one here caused
// the keypress event to fire sendMessage() twice.