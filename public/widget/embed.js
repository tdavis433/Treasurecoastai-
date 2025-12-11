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
    greetingPopup: null,
    isOpen: false,
    autoOpenTimer: null,
    greetingDismissed: false,
    bubblePulseInterval: null
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
      apiUrl: currentScript.getAttribute('data-api-url') || getBaseUrl(),
      showGreetingPopup: currentScript.getAttribute('data-show-greeting-popup') !== 'false',
      greetingTitle: currentScript.getAttribute('data-greeting-title') || 'Hi there!',
      greetingMessage: currentScript.getAttribute('data-greeting-message') || '',
      greetingDelay: parseInt(currentScript.getAttribute('data-greeting-delay') || '3', 10),
      businessName: currentScript.getAttribute('data-business-name') || '',
      businessSubtitle: currentScript.getAttribute('data-business-subtitle') || ''
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
  
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  
  function adjustColor(hex, amount) {
    var r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
    var g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
    var b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
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
  
  async function fetchFullConfigByClientBot(clientId, botId, apiUrl) {
    if (!clientId || !botId) return null;
    
    try {
      var response = await fetch(apiUrl + '/api/widget/full-config/' + clientId + '/' + botId);
      if (!response.ok) {
        console.warn('Failed to fetch widget config by clientId/botId:', response.status);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.warn('Error fetching widget config by clientId/botId:', error);
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
      'width: 64px',
      'height: 64px',
      'border-radius: 50%',
      'background: linear-gradient(135deg, ' + primaryColor + ', ' + adjustColor(primaryColor, -20) + ')',
      'cursor: pointer',
      'box-shadow: 0 0 30px ' + hexToRgba(primaryColor, 0.4) + ', 0 8px 25px rgba(0,0,0,0.3)',
      'z-index: 2147483646',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'transition: transform 0.3s ease, box-shadow 0.3s ease',
      'border: 2px solid ' + hexToRgba(primaryColor, 0.3),
      positionStyles
    ].join(';');
    
    var bubbleIcon = config.bubbleIcon;
    var avatarUrl = fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.avatarUrl;
    
    if (avatarUrl) {
      bubble.innerHTML = '<img src="' + avatarUrl + '" alt="Chat" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">';
    } else {
      bubble.innerHTML = getChatIcon(bubbleIcon);
    }
    
    var glowColorHover = hexToRgba(primaryColor, 0.65);
    var glowColorDefault = hexToRgba(primaryColor, 0.35);
    var isHovered = false;
    
    bubble.onmouseover = function() {
      isHovered = true;
      bubble.style.transform = 'scale(1.04) rotate(1.5deg)';
      bubble.style.boxShadow = '0 0 45px ' + glowColorHover + ', 0 10px 30px rgba(0,0,0,0.4)';
    };
    
    bubble.onmouseout = function() {
      isHovered = false;
      bubble.style.transform = 'scale(1) rotate(0deg)';
      bubble.style.boxShadow = '0 0 30px ' + glowColorDefault + ', 0 8px 25px rgba(0,0,0,0.3)';
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
    
    var pulseIntervalId = setInterval(function() {
      if (!document.body.contains(bubble)) {
        clearInterval(pulseIntervalId);
        return;
      }
      if (!isHovered && !window.TreasureCoastAI.isOpen) {
        bubble.style.boxShadow = '0 0 40px ' + hexToRgba(primaryColor, 0.45) + ', 0 8px 25px rgba(0,0,0,0.3)';
        bubble.style.opacity = '1';
        setTimeout(function() {
          if (!isHovered && !window.TreasureCoastAI.isOpen && document.body.contains(bubble)) {
            bubble.style.boxShadow = '0 0 30px ' + glowColorDefault + ', 0 8px 25px rgba(0,0,0,0.3)';
            bubble.style.opacity = '0.92';
          }
        }, 600);
      }
    }, 11000);
    
    window.TreasureCoastAI.bubblePulseInterval = pulseIntervalId;
    
    return bubble;
  }
  
  function getChatIcon(type) {
    if (type === 'message') {
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    }
    if (type === 'house-plus') {
      return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 3px rgba(255,255,255,0.3));"><path d="M3 9.5l9-7 9 7"></path><path d="M19 9.5v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-10"></path><path d="M12 14v4"></path><path d="M10 16h4"></path></svg>';
    }
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';
  }
  
  function getCloseIcon() {
    return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  }
  
  function getSmallCloseIcon() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  }
  
  function createGreetingPopup(config, fullConfig) {
    var popup = document.createElement('div');
    popup.id = 'tcai-greeting-popup';
    popup.setAttribute('data-testid', 'greeting-popup');
    
    var position = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.position) || config.position;
    var primaryColor = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.primaryColor) || config.primaryColor;
    var avatarUrl = fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.avatarUrl;
    
    var positionRight = position.indexOf('right') !== -1;
    var positionBottom = position.indexOf('bottom') !== -1;
    
    var greetingTitle = config.greetingTitle;
    var greetingMessage = config.greetingMessage || (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.greeting) || config.greeting;
    
    popup.style.cssText = [
      'position: fixed',
      positionBottom ? 'bottom: 105px' : 'top: 105px',
      positionRight ? 'right: 24px' : 'left: 24px',
      'width: 300px',
      'background: linear-gradient(135deg, rgba(15, 21, 32, 0.95), rgba(10, 10, 15, 0.98))',
      'backdrop-filter: blur(20px)',
      '-webkit-backdrop-filter: blur(20px)',
      'border-radius: 16px',
      'border: 1px solid ' + hexToRgba(primaryColor, 0.2),
      'box-shadow: 0 0 40px ' + hexToRgba(primaryColor, 0.15) + ', 0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      'z-index: 2147483645',
      'padding: 18px',
      'opacity: 0',
      'transform: translateY(10px) scale(0.95)',
      'transition: opacity 0.4s ease, transform 0.4s ease',
      'pointer-events: none',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(';');
    
    var avatarHtml = avatarUrl 
      ? '<img src="' + avatarUrl + '" style="width: 44px; height: 44px; border-radius: 12px; object-fit: cover; box-shadow: 0 0 20px ' + hexToRgba(primaryColor, 0.3) + ';">'
      : '<div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, ' + primaryColor + ', ' + adjustColor(primaryColor, -20) + '); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px ' + hexToRgba(primaryColor, 0.4) + ';"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
    
    popup.innerHTML = [
      '<div style="display: flex; align-items: flex-start; gap: 14px;">',
      '  <div style="flex-shrink: 0;">' + avatarHtml + '</div>',
      '  <div style="flex: 1; min-width: 0;">',
      '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">',
      '      <span style="font-weight: 600; font-size: 15px; color: #F8FAFC; letter-spacing: -0.01em;">' + greetingTitle + '</span>',
      '      <button id="tcai-greeting-close" style="background: rgba(255,255,255,0.05); border: none; cursor: pointer; padding: 6px; color: rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;" aria-label="Close greeting">' + getSmallCloseIcon() + '</button>',
      '    </div>',
      '    <p style="margin: 0 0 14px 0; font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5;">' + greetingMessage + '</p>',
      '    <button id="tcai-greeting-start" style="width: 100%; padding: 11px 16px; background: linear-gradient(135deg, ' + primaryColor + ', ' + adjustColor(primaryColor, -20) + '); color: #0A0A0F; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; box-shadow: 0 0 20px ' + hexToRgba(primaryColor, 0.3) + ';">',
      '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
      '      Start Chat',
      '    </button>',
      '  </div>',
      '</div>'
    ].join('');
    
    return popup;
  }
  
  function showGreetingPopup() {
    var tcai = window.TreasureCoastAI;
    if (!tcai.greetingPopup || tcai.greetingDismissed || tcai.isOpen) return;
    
    tcai.greetingPopup.style.display = 'block';
    tcai.greetingPopup.style.opacity = '1';
    tcai.greetingPopup.style.transform = 'translateY(0) scale(1)';
    tcai.greetingPopup.style.pointerEvents = 'auto';
  }
  
  function hideGreetingPopup() {
    var tcai = window.TreasureCoastAI;
    if (!tcai.greetingPopup) return;
    
    tcai.greetingPopup.style.opacity = '0';
    tcai.greetingPopup.style.transform = 'translateY(10px) scale(0.95)';
    tcai.greetingPopup.style.pointerEvents = 'none';
    tcai.greetingPopup.style.display = 'none';
  }
  
  function setupGreetingPopup(config, fullConfig) {
    var tcai = window.TreasureCoastAI;
    if (!config.showGreetingPopup) return;
    
    try {
      if (sessionStorage.getItem('tcai_greeting_dismissed') === 'true') {
        tcai.greetingDismissed = true;
        return;
      }
    } catch (e) {}
    
    var popup = createGreetingPopup(config, fullConfig);
    tcai.greetingPopup = popup;
    document.body.appendChild(popup);
    
    var closeBtn = document.getElementById('tcai-greeting-close');
    var startBtn = document.getElementById('tcai-greeting-start');
    
    if (closeBtn) {
      closeBtn.onclick = function() {
        tcai.greetingDismissed = true;
        hideGreetingPopup();
        try {
          sessionStorage.setItem('tcai_greeting_dismissed', 'true');
        } catch (e) {}
      };
    }
    
    if (startBtn) {
      var primaryColor = (fullConfig && fullConfig.widgetSettings && fullConfig.widgetSettings.primaryColor) || config.primaryColor;
      startBtn.onclick = function() {
        hideGreetingPopup();
        openWidget();
      };
      startBtn.onmouseover = function() {
        startBtn.style.transform = 'translateY(-1px)';
        startBtn.style.boxShadow = '0 0 30px ' + hexToRgba(primaryColor, 0.5);
      };
      startBtn.onmouseout = function() {
        startBtn.style.transform = 'translateY(0)';
        startBtn.style.boxShadow = '0 0 20px ' + hexToRgba(primaryColor, 0.3);
      };
    }
    
    if (closeBtn) {
      closeBtn.onmouseover = function() {
        closeBtn.style.background = 'rgba(255,255,255,0.1)';
        closeBtn.style.color = 'rgba(255,255,255,0.8)';
      };
      closeBtn.onmouseout = function() {
        closeBtn.style.background = 'rgba(255,255,255,0.05)';
        closeBtn.style.color = 'rgba(255,255,255,0.5)';
      };
    }
    
    setTimeout(function() {
      if (!tcai.greetingDismissed && !tcai.isOpen) {
        showGreetingPopup();
      }
    }, config.greetingDelay * 1000);
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
      
      if (config.businessName) {
        iframeConfig.businessName = config.businessName;
      }
      if (config.businessSubtitle) {
        iframeConfig.businessSubtitle = config.businessSubtitle;
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
    
    hideGreetingPopup();
    
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
    } else if (config.clientId && config.botId) {
      fullConfig = await fetchFullConfigByClientBot(config.clientId, config.botId, config.apiUrl);
    }
    window.TreasureCoastAI.fullConfig = fullConfig;
    
    var bubble = createBubble(config, fullConfig);
    var iframe = createIframe(config, fullConfig);
    
    window.TreasureCoastAI.bubble = bubble;
    window.TreasureCoastAI.iframe = iframe;
    
    document.body.appendChild(bubble);
    document.body.appendChild(iframe);
    
    window.addEventListener('message', handleMessage);
    
    setupThemeListener();
    setupAutoOpen(config, fullConfig);
    setupGreetingPopup(config, fullConfig);
    
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
