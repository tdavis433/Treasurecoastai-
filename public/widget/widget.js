(function() {
  'use strict';
  
  var config = {
    clientId: '',
    botId: '',
    primaryColor: '#2563eb',
    greeting: 'Hi! How can I help you today?',
    apiUrl: ''
  };
  
  var state = {
    messages: [],
    conversationId: null,
    isLoading: false,
    isPaused: false,
    error: null
  };
  
  var elements = {};
  
  function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      clientId: params.get('clientId') || '',
      botId: params.get('botId') || '',
      primaryColor: params.get('primaryColor') || '#2563eb',
      greeting: params.get('greeting') || 'Hi! How can I help you today?'
    };
  }
  
  function getApiUrl() {
    return window.location.origin;
  }
  
  function getStorageKey() {
    return 'tcai_conversation_' + config.clientId + '_' + config.botId;
  }
  
  function loadConversation() {
    try {
      var stored = localStorage.getItem(getStorageKey());
      if (stored) {
        var data = JSON.parse(stored);
        if (data.conversationId && data.messages && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          state.conversationId = data.conversationId;
          state.messages = data.messages;
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load conversation from storage:', e);
    }
    return false;
  }
  
  function saveConversation() {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify({
        conversationId: state.conversationId,
        messages: state.messages,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save conversation to storage:', e);
    }
  }
  
  function generateSessionId() {
    return 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function formatMessage(text) {
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
  
  function addMessage(role, content) {
    state.messages.push({ role: role, content: content, timestamp: Date.now() });
    renderMessages();
    saveConversation();
  }
  
  function renderMessages() {
    var html = '';
    
    state.messages.forEach(function(msg) {
      var className = msg.role === 'user' ? 'user' : 'bot';
      html += '<div class="tcai-message ' + className + '" data-testid="message-' + className + '">' + formatMessage(msg.content) + '</div>';
    });
    
    if (state.isLoading) {
      html += '<div class="tcai-typing" data-testid="typing-indicator">';
      html += '<div class="tcai-typing-dot"></div>';
      html += '<div class="tcai-typing-dot"></div>';
      html += '<div class="tcai-typing-dot"></div>';
      html += '</div>';
    }
    
    elements.messages.innerHTML = html;
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  function renderError(message) {
    var errorDiv = document.createElement('div');
    errorDiv.className = 'tcai-error';
    errorDiv.setAttribute('data-testid', 'error-message');
    errorDiv.textContent = message;
    elements.messages.appendChild(errorDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  function renderPausedState() {
    var container = document.querySelector('.tcai-container');
    container.innerHTML = [
      '<div class="tcai-header">',
      '  <div class="tcai-header-info">',
      '    <div class="tcai-avatar">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
      '    </div>',
      '    <div class="tcai-header-text">',
      '      <h1>Chat Assistant</h1>',
      '      <p>We\'ll be back soon</p>',
      '    </div>',
      '  </div>',
      '  <button class="tcai-close-btn" data-testid="button-close" onclick="closeWidget()">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '  </button>',
      '</div>',
      '<div class="tcai-paused">',
      '  <div class="tcai-paused-icon">',
      '    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>',
      '  </div>',
      '  <h2>Service Temporarily Unavailable</h2>',
      '  <p>Our chat service is currently paused. Please contact us directly or check back later.</p>',
      '</div>',
      '<div class="tcai-footer">',
      '  Powered by <a href="#">Treasure Coast AI</a>',
      '</div>'
    ].join('\n');
  }
  
  async function sendMessage(content) {
    if (!content.trim() || state.isLoading || state.isPaused) return;
    
    addMessage('user', content);
    
    state.isLoading = true;
    state.error = null;
    renderMessages();
    
    elements.input.value = '';
    elements.input.focus();
    elements.sendBtn.disabled = true;
    
    try {
      var apiMessages = state.messages.map(function(m) {
        return { role: m.role === 'user' ? 'user' : 'assistant', content: m.content };
      });
      
      if (!state.conversationId) {
        state.conversationId = generateSessionId();
      }
      
      var response = await fetch(config.apiUrl + '/api/chat/' + config.clientId + '/' + config.botId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: state.conversationId,
          language: 'en',
          source: 'widget'
        })
      });
      
      var data = await response.json();
      
      if (!response.ok) {
        if (data.status === 'paused') {
          state.isPaused = true;
          renderPausedState();
          return;
        }
        throw new Error(data.message || data.error || 'Failed to send message');
      }
      
      state.isLoading = false;
      addMessage('assistant', data.reply);
      
    } catch (error) {
      state.isLoading = false;
      renderMessages();
      renderError(error.message || 'Failed to send message. Please try again.');
      console.error('Chat error:', error);
    } finally {
      elements.sendBtn.disabled = false;
    }
  }
  
  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(elements.input.value);
    }
  }
  
  function handleSendClick() {
    sendMessage(elements.input.value);
  }
  
  window.closeWidget = function() {
    window.parent.postMessage({ type: 'TCAI_CLOSE' }, '*');
  };
  
  function handleQuickAction(text) {
    sendMessage(text);
  }
  
  function applyTheme() {
    document.documentElement.style.setProperty('--tcai-primary', config.primaryColor);
    
    var r = parseInt(config.primaryColor.slice(1, 3), 16);
    var g = parseInt(config.primaryColor.slice(3, 5), 16);
    var b = parseInt(config.primaryColor.slice(5, 7), 16);
    var hoverColor = '#' + [r, g, b].map(function(c) {
      return Math.max(0, c - 30).toString(16).padStart(2, '0');
    }).join('');
    document.documentElement.style.setProperty('--tcai-primary-hover', hoverColor);
  }
  
  function render() {
    var container = document.querySelector('.tcai-container');
    
    container.innerHTML = [
      '<div class="tcai-header">',
      '  <div class="tcai-header-info">',
      '    <div class="tcai-avatar" style="background: ' + config.primaryColor + '">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
      '    </div>',
      '    <div class="tcai-header-text">',
      '      <h1>Chat Assistant</h1>',
      '      <p>Online</p>',
      '    </div>',
      '  </div>',
      '  <button class="tcai-close-btn" data-testid="button-close" onclick="closeWidget()">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '  </button>',
      '</div>',
      '<div class="tcai-messages" id="tcai-messages" data-testid="messages-container"></div>',
      '<div class="tcai-input-area">',
      '  <div class="tcai-input-wrapper">',
      '    <input type="text" class="tcai-input" id="tcai-input" placeholder="Type your message..." data-testid="input-message">',
      '    <button class="tcai-send-btn" id="tcai-send" data-testid="button-send">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
      '    </button>',
      '  </div>',
      '</div>',
      '<div class="tcai-footer">',
      '  Powered by <a href="#">Treasure Coast AI</a>',
      '</div>'
    ].join('\n');
    
    elements.messages = document.getElementById('tcai-messages');
    elements.input = document.getElementById('tcai-input');
    elements.sendBtn = document.getElementById('tcai-send');
    
    elements.input.addEventListener('keypress', handleKeyPress);
    elements.sendBtn.addEventListener('click', handleSendClick);
    
    var hasExisting = loadConversation();
    
    if (!hasExisting && config.greeting) {
      addMessage('assistant', config.greeting);
    } else {
      renderMessages();
    }
    
    elements.input.focus();
  }
  
  function handleParentMessage(event) {
    var data = event.data;
    if (!data || !data.type) return;
    
    switch (data.type) {
      case 'TCAI_CONFIG':
        if (data.config) {
          Object.assign(config, data.config);
          applyTheme();
        }
        break;
      case 'TCAI_OPEN':
        if (elements.input) {
          elements.input.focus();
        }
        break;
    }
  }
  
  function init() {
    var urlParams = getUrlParams();
    config.clientId = urlParams.clientId;
    config.botId = urlParams.botId;
    config.primaryColor = urlParams.primaryColor;
    config.greeting = urlParams.greeting;
    config.apiUrl = getApiUrl();
    
    applyTheme();
    render();
    
    window.addEventListener('message', handleParentMessage);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
