// Chat Functions - Global functions for AI chat functionality

function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input?.value?.trim();
  
  if (message && window.chatManager) {
    window.chatManager.sendMessage(message);
    input.value = '';
  }
}

function sendQuickMessage(message) {
  if (window.chatManager) {
    window.chatManager.sendMessage(message);
  }
}

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});