(function() {
  'use strict';
  
  if (window.TreasureCoastAI && window.TreasureCoastAI.initialized) {
    console.warn('Treasure Coast AI widget already initialized');
    return;
  }
  
  window.TreasureCoastAI = {
    initialized: false,
    config: {},
    fullConfig: null,
    iframe: null,
    bubble: null,
    isOpen: false,
    autoOpenTimer: null
  };
  
  function getScriptConfig() {
    var scripts = document.getElementsByTagName('script');
    var currentScript = scripts[scripts.length - 1];
    
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) {
        currentScript = scripts[i];
        break;
      }
    }
    
    return {
      token: currentScript.getAttribute('data-token') || '',
      clientId: currentScript.getAttribute('data-client-id') || '',
      botId: currentScript.getAttribute('data-bot-id') || '',
      primaryColor: currentScript.getAttribute('data-primary-color') || '#2563eb',
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      greeting: currentScript.getAttribute('data-greeting') || 'Hi! How can I help you today?',
      bubbleIcon: currentScript.getAttribute('data-bubble-icon') || 'chat',
      theme: currentScript.getAttribute('data-theme') || 'dark',
      apiUrl: currentScript.getAttribute('data-api-url') || getBaseUrl()
    };
  }
  
  function getBaseUrl() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) {
        var url = new URL(scripts[i].src);
        return url.origin;
      }
    }
    return window.location.origin;
  }
  
  async function fetchFullConfig(token, apiUrl) {
    if (!token) return null;
    
    try {
      var response = await fetch(apiUrl + '/api/widget/full-config/' + token);
      if (!response.ok) {
        console.warn('Failed to fetch widget config:', response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn('Error fetching widget config:', error);
      return null;
    }
  }
  
  function getResolvedTheme(themeMode) {
    if (themeMode === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode || 'dark';
  }
  
  function createBubble(config, fullConfig) {
    var bubble = document.createElement('div');
    bubble.id = 'tcai-bubble';
    bubble.setAttribute('data-testid', 'widget-bubble');
    bubble.setAttribute('role', 'button');
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.setAttribute('tabindex', '0');
    
    var position = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.position) || config.position;
    var primaryColor = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.primaryColor) || config.primaryColor;
    
    var positionStyles = getPositionStyles(position, 'bubble');
    
    bubble.style.cssText = [
      'position: fixed',
      'width: 60px',
      'height: 60px',
      'border-radius: 50%',
      'background: ' + primaryColor,
      'cursor: pointer',
      'box-shadow: 0 4px 20px rgba(0,0,0,0.3)',
      'z-index: 2147483646',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'transition: transform 0.2s ease, box-shadow 0.2s ease',
      positionStyles
    ].join(';');
    
    var bubbleIcon = config.bubbleIcon;
    var avatarUrl = fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.avatarUrl;
    
    if (avatarUrl) {
      bubble.innerHTML = '<img src="' + avatarUrl + '" alt="Chat" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">';
    } else {
      bubble.innerHTML = getChatIcon(bubbleIcon);
    }
    
    bubble.onmouseover = function() {
      bubble.style.transform = 'scale(1.1)';
      bubble.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
    };
    
    bubble.onmouseout = function() {
      bubble.style.transform = 'scale(1)';
      bubble.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    };
    
    bubble.onclick = function() {
      toggleWidget();
    };
    
    bubble.onkeydown = function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleWidget();
      }
    };
    
    return bubble;
  }
  
  function getChatIcon(type) {
    if (type === 'message') {
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    }
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
  }
  
  function getCloseIcon() {
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  }
  
  function getPositionStyles(position, element) {
    var styles = [];
    var windowOffset = '24px';
    
    if (element === 'window') {
      if (position.indexOf('bottom') !== -1) {
        styles.push('bottom: 100px');
      } else {
        styles.push('top: 24px');
      }
    } else {
      if (position.indexOf('bottom') !== -1) {
        styles.push('bottom: ' + windowOffset);
      } else {
        styles.push('top: ' + windowOffset);
      }
    }
    
    if (position.indexOf('right') !== -1) {
      styles.push('right: ' + windowOffset);
    } else {
      styles.push('left: ' + windowOffset);
    }
    
    return styles.join(';');
  }
  
  function createIframe(config, fullConfig) {
    var iframe = document.createElement('iframe');
    iframe.id = 'tcai-iframe';
    iframe.setAttribute('data-testid', 'widget-iframe');
    iframe.setAttribute('title', 'Chat Widget');
    
    var position = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.position) || config.position;
    var themeMode = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.themeMode) || config.theme;
    var resolvedTheme = getResolvedTheme(themeMode);
    
    var positionStyles = getPositionStyles(position, 'window');
    var bgColor = resolvedTheme === 'light' ? '#ffffff' : '#1a1a2e';
    
    iframe.style.cssText = [
      'position: fixed',
      'width: 380px',
      'height: 600px',
      'max-height: calc(100vh - 120px)',
      'max-width: calc(100vw - 48px)',
      'border: none',
      'border-radius: 16px',
      'box-shadow: 0 10px 40px rgba(0,0,0,0.3)',
      'z-index: 2147483647',
      'opacity: 0',
      'transform: translateY(20px) scale(0.95)',
      'transition: opacity 0.3s ease, transform 0.3s ease',
      'pointer-events: none',
      'background: ' + bgColor,
      positionStyles
    ].join(';');
    
    var params = new URLSearchParams({
      clientId: config.clientId,
      botId: config.botId,
      primaryColor: (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.primaryColor) || config.primaryColor,
      greeting: (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.greeting) || config.greeting,
      theme: resolvedTheme
    });
    
    if (config.token) {
      params.set('token', config.token);
    }
    
    iframe.src = config.apiUrl + '/widget/frame.html?' + params.toString();
    
    iframe.onload = function() {
      var iframeConfig = Object.assign({}, config);
      if (fullConfig) {
        iframeConfig.fullConfig = fullConfig;
        iframeConfig.theme = resolvedTheme;
        if (fullConfig.widgetSettings) {
          iframeConfig.primaryColor = fullConfig.widgetSettings.primaryColor || iframeConfig.primaryColor;
          iframeConfig.greeting = fullConfig.widgetSettings.greeting || iframeConfig.greeting;
        }
      }
      
      iframe.contentWindow.postMessage({
        type: 'TCAI_CONFIG',
        config: iframeConfig
      }, '*');
    };
    
    return iframe;
  }
  
  function toggleWidget() {
    var tcai = window.TreasureCoastAI;
    
    if (tcai.isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }
  
  function openWidget() {
    var tcai = window.TreasureCoastAI;
    
    if (tcai.autoOpenTimer) {
      clearTimeout(tcai.autoOpenTimer);
      tcai.autoOpenTimer = null;
    }
    
    tcai.isOpen = true;
    tcai.iframe.style.opacity = '1';
    tcai.iframe.style.transform = 'translateY(0) scale(1)';
    tcai.iframe.style.pointerEvents = 'auto';
    tcai.bubble.innerHTML = getCloseIcon();
    tcai.bubble.setAttribute('aria-label', 'Close chat');
    
    tcai.iframe.contentWindow.postMessage({ type: 'TCAI_OPEN' }, '*');
    
    try {
      sessionStorage.setItem('tcai_opened', 'true');
    } catch (e) {}
  }
  
  function closeWidget() {
    var tcai = window.TreasureCoastAI;
    
    tcai.isOpen = false;
    tcai.iframe.style.opacity = '0';
    tcai.iframe.style.transform = 'translateY(20px) scale(0.95)';
    tcai.iframe.style.pointerEvents = 'none';
    
    var avatarUrl = tcai.fullConfig && tcai.fullConfig.widgetSettings && tcai.fullConfig.widgetSettings.avatarUrl;
    if (avatarUrl) {
      tcai.bubble.innerHTML = '<img src="' + avatarUrl + '" alt="Chat" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">';
    } else {
      tcai.bubble.innerHTML = getChatIcon(tcai.config.bubbleIcon);
    }
    tcai.bubble.setAttribute('aria-label', 'Open chat');
  }
  
  function setupAutoOpen(config, fullConfig) {
    if (!fullConfig || !fullConfig.widgetSettings) return;
    
    var settings = fullConfig.widgetSettings;
    
    if (!settings.autoOpenEnabled) return;
    
    try {
      if (sessionStorage.getItem('tcai_opened') === 'true') {
        return;
      }
    } catch (e) {}
    
    var delayMs = (settings.autoOpenDelay || 5) * 1000;
    
    window.TreasureCoastAI.autoOpenTimer = setTimeout(function() {
      if (!window.TreasureCoastAI.isOpen) {
        openWidget();
      }
    }, delayMs);
  }
  
  function handleMessage(event) {
    var data = event.data;
    
    if (!data || !data.type) return;
    
    switch (data.type) {
      case 'TCAI_CLOSE':
        closeWidget();
        break;
      case 'TCAI_RESIZE':
        if (data.height && window.TreasureCoastAI.iframe) {
          window.TreasureCoastAI.iframe.style.height = Math.min(data.height, window.innerHeight - 120) + 'px';
        }
        break;
      case 'TCAI_PLAY_SOUND':
        if (data.sound) {
          playNotificationSound(data.sound);
        }
        break;
    }
  }
  
  function playNotificationSound(soundType) {
    var tcai = window.TreasureCoastAI;
    if (!tcai.fullConfig || !tcai.fullConfig.widgetSettings) return;
    
    var settings = tcai.fullConfig.widgetSettings;
    if (!settings.notificationSoundEnabled) return;
    
    try {
      var audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var oscillator = audioContext.createOscillator();
      var gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = soundType === 'message' ? 800 : 600;
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }
  
  function setupThemeListener() {
    if (!window.matchMedia) return;
    
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', function(e) {
      var tcai = window.TreasureCoastAI;
      if (!tcai.fullConfig || !tcai.fullConfig.widgetSettings) return;
      
      var themeMode = tcai.fullConfig.widgetSettings.themeMode;
      if (themeMode !== 'auto') return;
      
      var newTheme = e.matches ? 'dark' : 'light';
      var bgColor = newTheme === 'light' ? '#ffffff' : '#1a1a2e';
      
      tcai.iframe.style.background = bgColor;
      tcai.iframe.contentWindow.postMessage({
        type: 'TCAI_THEME_CHANGE',
        theme: newTheme
      }, '*');
    });
  }
  
  async function init() {
    var config = getScriptConfig();
    
    if (!config.clientId || !config.botId) {
      console.error('Treasure Coast AI: Missing required data-client-id or data-bot-id attributes');
      return;
    }
    
    window.TreasureCoastAI.config = config;
    
    var fullConfig = null;
    if (config.token) {
      fullConfig = await fetchFullConfig(config.token, config.apiUrl);
      window.TreasureCoastAI.fullConfig = fullConfig;
    }
    
    var bubble = createBubble(config, fullConfig);
    var iframe = createIframe(config, fullConfig);
    
    window.TreasureCoastAI.bubble = bubble;
    window.TreasureCoastAI.iframe = iframe;
    
    document.body.appendChild(bubble);
    document.body.appendChild(iframe);
    
    window.addEventListener('message', handleMessage);
    
    setupThemeListener();
    setupAutoOpen(config, fullConfig);
    
    window.TreasureCoastAI.initialized = true;
    window.TreasureCoastAI.open = openWidget;
    window.TreasureCoastAI.close = closeWidget;
    window.TreasureCoastAI.toggle = toggleWidget;
    
    console.log('Treasure Coast AI widget initialized for ' + config.clientId + '/' + config.botId);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
