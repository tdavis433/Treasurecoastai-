(function() {
  'use strict';
  
  var config = {
    clientId: '',
    botId: '',
    primaryColor: '#2563eb',
    greeting: 'Hi! How can I help you today?',
    apiUrl: '',
    theme: 'dark',
    avatarUrl: '',
    showPoweredBy: true,
    notificationSoundEnabled: false,
    businessName: 'Chat Assistant',
    businessSubtitle: 'Online',
    businessType: 'general',
    quickActions: []
  };
  
  var state = {
    messages: [],
    conversationId: null,
    isLoading: false,
    isPaused: false,
    error: null,
    quickActionsShown: false,
    bookingConfirmation: null  // { label: string, bookingType: string }
  };
  
  var elements = {};
  
  function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      clientId: params.get('clientId') || '',
      botId: params.get('botId') || '',
      primaryColor: params.get('primaryColor') || '#2563eb',
      greeting: params.get('greeting') || 'Hi! How can I help you today?',
      theme: params.get('theme') || 'dark',
      token: params.get('token') || '',
      businessType: params.get('businessType') || 'general',
      businessName: params.get('businessName') || 'Chat Assistant'
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
  
  function isValidHexColor(color) {
    if (!color || typeof color !== 'string') return false;
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
  }
  
  function sanitizeColor(color) {
    if (isValidHexColor(color)) return color;
    console.warn('Invalid color provided, using default: ' + color);
    return '#2563eb';
  }
  
  function formatMessage(text) {
    return escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
  
  function playNotificationSound(type) {
    if (!config.notificationSoundEnabled) return;
    
    window.parent.postMessage({
      type: 'TCAI_PLAY_SOUND',
      sound: type
    }, '*');
  }
  
  function addMessage(role, content) {
    state.messages.push({ role: role, content: content, timestamp: Date.now() });
    renderMessages();
    saveConversation();
    
    if (role === 'assistant') {
      playNotificationSound('message');
    }
  }
  
  function renderMessages() {
    console.log('[TCAI Widget] renderMessages called, state.bookingConfirmation:', state.bookingConfirmation);
    
    var html = '';
    
    state.messages.forEach(function(msg, idx) {
      var className = msg.role === 'user' ? 'user' : 'bot';
      html += '<div class="tcai-message ' + className + '" data-testid="widget-message-' + msg.role + '-' + idx + '" role="article" aria-label="' + (msg.role === 'user' ? 'Your message' : 'Assistant message') + '">' + formatMessage(msg.content) + '</div>';
    });
    
    // Render booking confirmation if present in state
    if (state.bookingConfirmation) {
      console.log('[TCAI Widget] Adding booking confirmation HTML for type:', state.bookingConfirmation.bookingType);
      var typeLabel = 'Appointment';
      if (state.bookingConfirmation.bookingType === 'tour') {
        typeLabel = 'Tour';
      } else if (state.bookingConfirmation.bookingType === 'call' || state.bookingConfirmation.bookingType === 'phone_call') {
        typeLabel = 'Call';
      }
      
      html += '<div class="tcai-booking-confirmation">';
      html += '<div class="tcai-booking-success" data-testid="booking-confirmation" style="';
      html += '  display: flex;';
      html += '  align-items: center;';
      html += '  gap: 10px;';
      html += '  padding: 12px 16px;';
      html += '  margin: 12px 16px;';
      html += '  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%);';
      html += '  border: 1px solid rgba(16, 185, 129, 0.4);';
      html += '  border-radius: 8px;';
      html += '  color: #10b981;';
      html += '">';
      html += '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
      html += '    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>';
      html += '    <polyline points="22 4 12 14.01 9 11.01"></polyline>';
      html += '  </svg>';
      html += '  <div style="flex: 1;">';
      html += '    <div style="font-weight: 600; font-size: 14px;">' + escapeHtml(typeLabel) + ' Request Received</div>';
      html += '    <div style="font-size: 12px; opacity: 0.8; margin-top: 2px;">Our team will be in touch shortly to confirm.</div>';
      html += '  </div>';
      html += '</div>';
      html += '</div>';
    }
    
    if (state.isLoading) {
      html += '<div class="tcai-typing" data-testid="typing-indicator" aria-label="Assistant is typing">';
      html += '<div class="tcai-typing-bar"></div>';
      html += '<div class="tcai-typing-bar"></div>';
      html += '<div class="tcai-typing-bar"></div>';
      html += '</div>';
    }
    
    elements.messages.innerHTML = html;
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  function renderError(message) {
    var errorDiv = document.createElement('div');
    errorDiv.className = 'tcai-error';
    errorDiv.setAttribute('data-testid', 'error-message');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.textContent = message;
    elements.messages.appendChild(errorDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  // Validate booking URL - strictly enforce https:// using URL parser
  function isValidBookingUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    try {
      // Trim whitespace and parse with URL constructor for strict validation
      var parsed = new URL(url.trim());
      
      // Only allow https: protocol (case-insensitive via URL parser)
      if (parsed.protocol !== 'https:') {
        console.warn('Invalid booking URL blocked');
        return false;
      }
      
      // Ensure we have a valid hostname
      if (!parsed.hostname || parsed.hostname.length < 3) {
        console.warn('Invalid booking URL blocked');
        return false;
      }
      
      return true;
    } catch (e) {
      // URL constructor throws on invalid URLs (including javascript:, data:, etc.)
      console.warn('Invalid booking URL blocked');
      return false;
    }
  }

  function showBookingButton(bookingUrl) {
    // Remove any existing booking button or fallback CTA
    var existingBtn = document.querySelector('.tcai-booking-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    var existingFallback = document.querySelector('.tcai-booking-fallback');
    if (existingFallback) {
      existingFallback.remove();
    }
    
    // Validate URL before rendering
    if (!isValidBookingUrl(bookingUrl)) {
      // Show fallback CTA instead of silent failure
      showBookingFallback();
      return;
    }
    
    // Create booking button
    var bookingDiv = document.createElement('div');
    bookingDiv.className = 'tcai-booking-container';
    bookingDiv.innerHTML = [
      '<a href="' + escapeHtml(bookingUrl) + '" target="_blank" rel="noopener noreferrer" class="tcai-booking-btn" data-testid="button-book-appointment" style="',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 8px;',
      '  padding: 12px 20px;',
      '  margin: 12px 16px;',
      '  background: ' + config.primaryColor + ';',
      '  color: white;',
      '  border-radius: 8px;',
      '  text-decoration: none;',
      '  font-weight: 600;',
      '  font-size: 14px;',
      '  transition: opacity 0.2s;',
      '">',
      '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>',
      '    <line x1="16" y1="2" x2="16" y2="6"></line>',
      '    <line x1="8" y1="2" x2="8" y2="6"></line>',
      '    <line x1="3" y1="10" x2="21" y2="10"></line>',
      '  </svg>',
      '  Book Appointment',
      '</a>'
    ].join('');
    
    elements.messages.appendChild(bookingDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  // Show booking confirmation for internal bookings (already auto-saved)
  function showBookingConfirmation(label, bookingType) {
    console.log('[TCAI Widget] showBookingConfirmation called:', { label: label, bookingType: bookingType });
    console.log('[TCAI Widget] Current state.bookingConfirmation before:', state.bookingConfirmation);
    
    // Set booking confirmation in state so it persists across re-renders
    state.bookingConfirmation = {
      label: label,
      bookingType: bookingType
    };
    
    console.log('[TCAI Widget] Set state.bookingConfirmation to:', state.bookingConfirmation);
    
    // Re-render messages to include the confirmation
    renderMessages();
    
    console.log('[TCAI Widget] After renderMessages, checking DOM for booking-confirmation:', 
      document.querySelector('[data-testid="booking-confirmation"]') ? 'FOUND' : 'NOT FOUND');
  }
  
  // Fallback CTA when booking URL is invalid or missing
  function showBookingFallback() {
    var fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'tcai-booking-fallback';
    fallbackDiv.setAttribute('data-testid', 'booking-fallback-cta');
    
    var fallbackText = '';
    var hasPhone = config.businessPhone && config.businessPhone.trim();
    var hasEmail = config.businessEmail && config.businessEmail.trim();
    
    if (hasPhone && hasEmail) {
      fallbackText = 'To book, please call/text us at ' + escapeHtml(config.businessPhone) + ' or email ' + escapeHtml(config.businessEmail) + '.';
    } else if (hasPhone) {
      fallbackText = 'To book, please call/text us at ' + escapeHtml(config.businessPhone) + '.';
    } else if (hasEmail) {
      fallbackText = 'To book, please email us at ' + escapeHtml(config.businessEmail) + '.';
    } else {
      fallbackText = 'Interested in booking? Share your contact info and we\'ll reach out!';
    }
    
    fallbackDiv.innerHTML = [
      '<div style="',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 12px 16px;',
      '  margin: 12px 16px;',
      '  background: rgba(var(--tcai-primary-rgb), 0.1);',
      '  border: 1px solid rgba(var(--tcai-primary-rgb), 0.3);',
      '  border-radius: 8px;',
      '  font-size: 14px;',
      '  line-height: 1.4;',
      '">',
      '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + config.primaryColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">',
      '    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>',
      '    <line x1="16" y1="2" x2="16" y2="6"></line>',
      '    <line x1="8" y1="2" x2="8" y2="6"></line>',
      '    <line x1="3" y1="10" x2="21" y2="10"></line>',
      '  </svg>',
      '  <span>' + fallbackText + '</span>',
      '</div>'
    ].join('');
    
    elements.messages.appendChild(fallbackDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  function renderPausedState() {
    var container = document.querySelector('.tcai-container');
    container.innerHTML = [
      '<div class="tcai-header">',
      '  <div class="tcai-header-info">',
      '    ' + getAvatarHtml(),
      '    <div class="tcai-header-text">',
      '      <h1>' + escapeHtml(config.businessName) + '</h1>',
      '      <p>We\'ll be back soon</p>',
      '    </div>',
      '  </div>',
      '  <button class="tcai-close-btn" data-testid="button-close" aria-label="Close chat" onclick="closeWidget()">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '  </button>',
      '</div>',
      '<div class="tcai-paused" role="status">',
      '  <div class="tcai-paused-icon">',
      '    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>',
      '  </div>',
      '  <h2>Service Temporarily Unavailable</h2>',
      '  <p>Our chat service is currently paused. Please contact us directly or check back later.</p>',
      '</div>',
      getFooterHtml()
    ].join('\n');
  }
  
  function getBusinessIcon() {
    var type = config.businessType || 'general';
    var icons = {
      auto_shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>',
      barber_salon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><path d="M8.12 8.12 12 12"></path><path d="M20 4 8.12 15.88"></path><circle cx="6" cy="18" r="3"></circle><path d="M14.8 14.8 20 20"></path></svg>',
      gym_fitness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 1 0-7 0"></path><path d="M14 17h4"></path><path d="M18 13v8"></path><path d="M6 13v8"></path><path d="M6 17h4"></path><path d="m11 21 5-10 5 10"></path><path d="m3 21 5-10 5 10"></path></svg>',
      home_services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      med_spa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5.2 6.2 1.4 1.4"></path><path d="M2 13h2"></path><path d="M20 13h2"></path><path d="m17.4 7.6 1.4-1.4"></path><path d="M22 17H2"></path><path d="M22 21H2"></path><path d="M16 13a4 4 0 0 0-8 0"></path><path d="M12 5V2.5"></path></svg>',
      real_estate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 10-8.5-8.5a2.12 2.12 0 0 0-3 0L1 10"></path><path d="M21 10v11a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10"></path></svg>',
      restaurant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>',
      tattoo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a1 1 0 0 1 1 1v8a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1Z"></path><path d="M21 12a1 1 0 0 1-1 1h-8a1 1 0 0 1 0-2h8a1 1 0 0 1 1 1Z"></path><path d="M12 21a1 1 0 0 1-1-1v-8a1 1 0 0 1 2 0v8a1 1 0 0 1-1 1Z"></path><path d="M3 12a1 1 0 0 1 1-1h8a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1Z"></path></svg>',
      sober_living: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>',
      pet_grooming: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="20" cy="16" r="2"></circle><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"></path></svg>',
      general: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>'
    };
    return icons[type] || icons.general;
  }
  
  function getAvatarHtml() {
    if (config.avatarUrl) {
      return '<div class="tcai-avatar"><img src="' + escapeHtml(config.avatarUrl) + '" alt="' + escapeHtml(config.businessName) + '" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"></div>';
    }
    return '<div class="tcai-avatar">' + getBusinessIcon() + '</div>';
  }
  
  function getFooterHtml() {
    if (!config.showPoweredBy) {
      return '';
    }
    return '<div class="tcai-footer">Powered by <a href="https://treasurecoastai.com" target="_blank" rel="noopener">Treasure Coast AI</a></div>';
  }
  
  function triggerBorderRipple() {
    var container = document.querySelector('.tcai-container');
    if (container) {
      container.classList.remove('message-sent');
      void container.offsetWidth;
      container.classList.add('message-sent');
      setTimeout(function() {
        container.classList.remove('message-sent');
      }, 600);
    }
  }
  
  async function sendMessage(content) {
    if (!content.trim() || state.isLoading || state.isPaused) return;
    
    triggerBorderRipple();
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
      
      console.log('[TCAI Widget] Response data:', JSON.stringify(data));
      console.log('[TCAI Widget] data.meta:', data.meta);
      console.log('[TCAI Widget] data.meta?.actions:', data.meta?.actions);
      
      // Handle booking actions from the orchestrator
      if (data.meta) {
        console.log('[TCAI Widget] Full meta received:', JSON.stringify(data.meta));
        
        // Check for BOOKING_FINALIZE action in actions array
        if (data.meta.actions && Array.isArray(data.meta.actions)) {
          var bookingAction = data.meta.actions.find(function(a) { return a.type === 'BOOKING_FINALIZE'; });
          console.log('[TCAI Widget] Booking action found:', bookingAction ? JSON.stringify(bookingAction) : 'none');
          if (bookingAction) {
            if (bookingAction.handling === 'external' && bookingAction.externalUrl) {
              // External booking - show button to redirect
              console.log('[TCAI Widget] Showing external booking button');
              showBookingButton(bookingAction.externalUrl);
            } else if (bookingAction.handling === 'internal') {
              // Internal booking - show confirmation (booking was auto-saved)
              console.log('[TCAI Widget] Calling showBookingConfirmation for internal booking');
              showBookingConfirmation(bookingAction.label || 'Booking Confirmed', bookingAction.bookingType);
            } else {
              console.log('[TCAI Widget] Unknown handling type:', bookingAction.handling);
            }
          }
        } else {
          console.log('[TCAI Widget] No actions array in meta');
        }
        
        // Fallback: Show booking button if external booking URL is provided (legacy support)
        if (!data.meta.actions && data.meta.externalBookingUrl) {
          console.log('[TCAI Widget] Using externalBookingUrl fallback');
          showBookingButton(data.meta.externalBookingUrl);
        }
        // Show internal booking confirmation if booking was saved (legacy fallback)
        else if (!data.meta.actions && data.meta.bookingSaved && data.meta.bookingMode === 'internal') {
          console.log('[TCAI Widget] Showing confirmation via bookingSaved fallback');
          showBookingConfirmation('Booking Request Received', data.meta.bookingType);
        }
      } else {
        console.log('[TCAI Widget] No meta in response');
      }
      
    } catch (error) {
      state.isLoading = false;
      renderMessages();
      
      // Show friendly error with retry button - never expose stack traces
      var errorMsg = error.message || 'Failed to send message.';
      var friendlyMsg = 'Something went wrong. Please try again.';
      if (errorMsg.includes('high demand') || errorMsg.includes('rate limit') || errorMsg.includes('overloaded')) {
        friendlyMsg = 'Our AI is experiencing high demand. Please wait a moment and try again.';
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        friendlyMsg = 'Connection issue. Please check your internet and try again.';
      }
      renderErrorWithRetry(friendlyMsg, content);
      // Log to console for debugging (not exposed to UI)
      console.error('Chat error:', error);
    } finally {
      elements.sendBtn.disabled = false;
    }
  }
  
  // Store last failed message for retry
  var lastFailedMessage = '';

  function renderErrorWithRetry(message, failedContent) {
    // Store failed message for retry button
    if (failedContent) {
      lastFailedMessage = failedContent;
    }
    
    // Sanitize error message - never show stack traces
    var safeMessage = message;
    if (safeMessage.includes('Error:') || safeMessage.includes('at ') || safeMessage.length > 100) {
      safeMessage = 'Something went wrong. Please try again.';
    }
    
    var errorDiv = document.createElement('div');
    errorDiv.className = 'tcai-error tcai-error-recoverable';
    errorDiv.setAttribute('data-testid', 'error-message');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = [
      '<div class="tcai-error-content">',
      '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      '  <span>' + escapeHtml(safeMessage) + '</span>',
      '</div>',
      '<button class="tcai-retry-btn" data-testid="button-retry" style="',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  gap: 6px;',
      '  margin-top: 8px;',
      '  padding: 8px 16px;',
      '  background: rgba(255,255,255,0.1);',
      '  color: inherit;',
      '  border: 1px solid rgba(255,255,255,0.2);',
      '  border-radius: 6px;',
      '  font-size: 13px;',
      '  cursor: pointer;',
      '  transition: background 0.2s;',
      '">',
      '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>',
      '  Retry',
      '</button>'
    ].join('');
    elements.messages.appendChild(errorDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
    
    // Attach retry button handler
    var retryBtn = errorDiv.querySelector('.tcai-retry-btn');
    if (retryBtn) {
      retryBtn.onclick = function() {
        errorDiv.remove();
        if (lastFailedMessage) {
          sendMessage(lastFailedMessage);
        } else if (elements.input && elements.input.value.trim()) {
          sendMessage(elements.input.value);
        }
      };
      retryBtn.onmouseover = function() {
        retryBtn.style.background = 'rgba(255,255,255,0.2)';
      };
      retryBtn.onmouseout = function() {
        retryBtn.style.background = 'rgba(255,255,255,0.1)';
      };
    }
    
    // Re-enable input after brief timeout
    setTimeout(function() {
      if (elements.input) {
        elements.input.disabled = false;
        elements.input.focus();
      }
    }, 500);
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(elements.input.value);
    }
    // Shift+Enter allows line breaks naturally
  }
  
  function handleSendClick() {
    sendMessage(elements.input.value);
  }
  
  window.closeWidget = function() {
    window.parent.postMessage({ type: 'TCAI_CLOSE' }, '*');
  };
  
  window.resetChat = function() {
    // Clear local state and storage (does NOT delete saved leads/bookings in DB)
    state.messages = [];
    state.conversationId = null;
    state.quickActionsShown = false;
    state.error = null;
    state.isLoading = false;
    
    try {
      localStorage.removeItem(getStorageKey());
    } catch (e) {
      console.warn('Failed to clear conversation from storage:', e);
    }
    
    // Re-render with greeting
    if (config.greeting) {
      addMessage('assistant', config.greeting);
      setTimeout(function() {
        renderQuickActions();
      }, 100);
    } else {
      renderMessages();
    }
    
    if (elements.input) {
      elements.input.focus();
    }
  };
  
  function handleQuickAction(text) {
    hideQuickActions();
    sendMessage(text);
  }
  
  function renderQuickActions() {
    if (state.quickActionsShown || !config.quickActions || config.quickActions.length === 0) {
      return;
    }
    
    if (state.messages.length > 1) {
      return;
    }
    
    var existingActions = document.querySelector('.tcai-quick-actions');
    if (existingActions) {
      existingActions.remove();
    }
    
    var actionsHtml = '<div class="tcai-quick-actions" data-testid="quick-actions-container">';
    config.quickActions.forEach(function(action, index) {
      var label = action.label || action.id;
      var prompt = action.prompt || label;
      actionsHtml += '<button class="tcai-quick-action" data-testid="quick-action-' + index + '" data-prompt="' + escapeHtml(prompt) + '">' + escapeHtml(label) + '</button>';
    });
    actionsHtml += '</div>';
    
    elements.messages.insertAdjacentHTML('beforeend', actionsHtml);
    
    var actionButtons = document.querySelectorAll('.tcai-quick-action');
    actionButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var prompt = this.getAttribute('data-prompt');
        handleQuickAction(prompt);
      });
    });
    
    state.quickActionsShown = true;
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }
  
  function hideQuickActions() {
    var actionsContainer = document.querySelector('.tcai-quick-actions');
    if (actionsContainer) {
      actionsContainer.style.opacity = '0';
      actionsContainer.style.transition = 'opacity 0.3s ease';
      setTimeout(function() {
        if (actionsContainer.parentNode) {
          actionsContainer.remove();
        }
      }, 300);
    }
  }
  
  function applyTheme() {
    document.documentElement.style.setProperty('--tcai-primary', config.primaryColor);
    
    var r = parseInt(config.primaryColor.slice(1, 3), 16);
    var g = parseInt(config.primaryColor.slice(3, 5), 16);
    var b = parseInt(config.primaryColor.slice(5, 7), 16);
    
    // Set RGB values for rgba() usage in CSS
    document.documentElement.style.setProperty('--tcai-primary-rgb', r + ', ' + g + ', ' + b);
    
    var hoverColor = '#' + [r, g, b].map(function(c) {
      return Math.max(0, c - 30).toString(16).padStart(2, '0');
    }).join('');
    document.documentElement.style.setProperty('--tcai-primary-hover', hoverColor);
    
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add('theme-' + config.theme);
  }
  
  function render() {
    var container = document.querySelector('.tcai-container');
    
    container.innerHTML = [
      '<div class="tcai-header">',
      '  <div class="tcai-header-info">',
      '    ' + getAvatarHtml(),
      '    <div class="tcai-header-text">',
      '      <h1>' + escapeHtml(config.businessName) + '</h1>',
      '      <p><span class="tcai-status-dot"></span>' + escapeHtml(config.businessSubtitle) + '</p>',
      '    </div>',
      '  </div>',
      '  <div class="tcai-header-actions">',
      '    <button class="tcai-reset-btn" data-testid="button-reset" aria-label="Reset chat" onclick="resetChat()" title="Reset Chat">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>',
      '    </button>',
      '    <button class="tcai-close-btn" data-testid="button-close" aria-label="Close chat" onclick="closeWidget()">',
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      '    </button>',
      '  </div>',
      '</div>',
      '<div class="tcai-ai-sync" id="tcai-ai-sync" data-testid="ai-sync-indicator">',
      '  <div class="tcai-ai-sync-dot"></div>',
      '  <span class="tcai-ai-sync-text">AI Sync: Updating knowledge base...</span>',
      '</div>',
      '<div class="tcai-status-bar" data-testid="status-bar">',
      '  <span class="tcai-status-bar-text"><span class="tcai-status-bar-dot"></span>Online</span>',
      '  <span class="tcai-status-bar-divider">•</span>',
      '  <span class="tcai-status-bar-text">Secured by TCAI</span>',
      '</div>',
      '<div class="tcai-messages" id="tcai-messages" data-testid="messages-container" role="log" aria-live="polite" aria-label="Chat messages"></div>',
      '<div class="tcai-input-area">',
      '  <div class="tcai-input-wrapper">',
      '    <input type="text" class="tcai-input" id="tcai-input" placeholder="Type your message..." data-testid="input-message" aria-label="Message input">',
      '    <button class="tcai-send-btn" id="tcai-send" data-testid="button-send" aria-label="Send message">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
      '    </button>',
      '  </div>',
      '</div>',
      getFooterHtml()
    ].join('\n');
    
    elements.messages = document.getElementById('tcai-messages');
    elements.input = document.getElementById('tcai-input');
    elements.sendBtn = document.getElementById('tcai-send');
    
    elements.input.addEventListener('keydown', handleKeyDown);
    elements.sendBtn.addEventListener('click', handleSendClick);
    
    var hasExisting = loadConversation();
    
    if (!hasExisting && config.greeting) {
      addMessage('assistant', config.greeting);
      setTimeout(function() {
        renderQuickActions();
      }, 100);
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
          if (data.config.primaryColor) {
            data.config.primaryColor = sanitizeColor(data.config.primaryColor);
          }
          Object.assign(config, data.config);
          
          if (data.config.fullConfig && data.config.fullConfig.widgetSettings) {
            var ws = data.config.fullConfig.widgetSettings;
            config.avatarUrl = ws.avatarUrl || '';
            config.showPoweredBy = ws.showPoweredBy !== false;
            config.notificationSoundEnabled = ws.notificationSoundEnabled || false;
            config.theme = data.config.theme || 'dark';
            if (ws.primaryColor) config.primaryColor = sanitizeColor(ws.primaryColor);
            if (ws.greeting) config.greeting = ws.greeting;
          }
          
          if (data.config.fullConfig && data.config.fullConfig.botConfig) {
            config.businessName = data.config.fullConfig.botConfig.businessName || 'Chat Assistant';
            config.businessSubtitle = data.config.fullConfig.botConfig.businessSubtitle || 'Online';
          }
          
          if (data.config.businessName) {
            config.businessName = data.config.businessName;
          }
          if (data.config.businessSubtitle) {
            config.businessSubtitle = data.config.businessSubtitle;
          }
          if (data.config.businessType) {
            config.businessType = data.config.businessType;
          }
          
          if (data.config.quickActions && Array.isArray(data.config.quickActions)) {
            config.quickActions = data.config.quickActions;
            setTimeout(function() {
              renderQuickActions();
            }, 150);
          }
          
          if (data.config.fullConfig && data.config.fullConfig.quickActions) {
            config.quickActions = data.config.fullConfig.quickActions;
            setTimeout(function() {
              renderQuickActions();
            }, 150);
          }
          
          applyTheme();
          
          var headerTitle = document.querySelector('.tcai-header-text h1');
          var headerSubtitle = document.querySelector('.tcai-header-text p');
          var headerAvatar = document.querySelector('.tcai-avatar');
          if (headerTitle) headerTitle.textContent = config.businessName;
          if (headerSubtitle) headerSubtitle.textContent = config.businessSubtitle;
          if (headerAvatar) headerAvatar.innerHTML = config.avatarUrl ? '<img src="' + escapeHtml(config.avatarUrl) + '" alt="' + escapeHtml(config.businessName) + '" style="width: 100%; height: 100%; border-radius: 12px; object-fit: cover;">' : getBusinessIcon();
        }
        break;
      case 'TCAI_OPEN':
        if (elements.input) {
          elements.input.focus();
        }
        break;
      case 'TCAI_THEME_CHANGE':
        if (data.theme) {
          config.theme = data.theme;
          applyTheme();
        }
        break;
    }
  }
  
  function initWithConfig(externalConfig, containerElement) {
    if (externalConfig.clientId) config.clientId = externalConfig.clientId;
    if (externalConfig.botId) config.botId = externalConfig.botId;
    if (externalConfig.primaryColor) config.primaryColor = sanitizeColor(externalConfig.primaryColor);
    if (externalConfig.greeting) config.greeting = externalConfig.greeting;
    if (externalConfig.theme) config.theme = externalConfig.theme;
    if (externalConfig.businessType) config.businessType = externalConfig.businessType;
    if (externalConfig.businessName) config.businessName = externalConfig.businessName;
    if (externalConfig.businessSubtitle) config.businessSubtitle = externalConfig.businessSubtitle;
    if (externalConfig.apiUrl) config.apiUrl = externalConfig.apiUrl;
    
    if (externalConfig.fullConfig && externalConfig.fullConfig.widgetSettings) {
      var ws = externalConfig.fullConfig.widgetSettings;
      if (ws.avatarUrl) config.avatarUrl = ws.avatarUrl;
      if (ws.showPoweredBy !== undefined) config.showPoweredBy = ws.showPoweredBy;
      if (ws.notificationSoundEnabled !== undefined) config.notificationSoundEnabled = ws.notificationSoundEnabled;
      if (ws.primaryColor) config.primaryColor = sanitizeColor(ws.primaryColor);
      if (ws.greeting) config.greeting = ws.greeting;
    }
    
    if (externalConfig.fullConfig && externalConfig.fullConfig.quickActions) {
      config.quickActions = externalConfig.fullConfig.quickActions;
    }
    
    applyTheme();
    render();
    
    window.closeWidget = function() {
      if (window.TreasureCoastAI && window.TreasureCoastAI.close) {
        window.TreasureCoastAI.close();
      }
    };
  }

  function init() {
    var urlParams = getUrlParams();
    config.clientId = urlParams.clientId;
    config.botId = urlParams.botId;
    config.primaryColor = sanitizeColor(urlParams.primaryColor);
    config.greeting = urlParams.greeting;
    config.theme = urlParams.theme;
    config.businessType = urlParams.businessType;
    config.businessName = urlParams.businessName;
    config.apiUrl = getApiUrl();
    
    applyTheme();
    render();
    
    window.addEventListener('message', handleParentMessage);
  }
  
  window.TCAIWidget = {
    init: initWithConfig
  };
  
  var isEmbedded = window.TCAI_TEST_MODE === true || window.frameElement !== null || window.parent !== window;
  
  if (!isEmbedded || window.frameElement !== null) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
