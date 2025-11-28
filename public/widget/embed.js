(function() {
  'use strict';
  
  if (window.TreasureCoastAI && window.TreasureCoastAI.initialized) {
    console.warn('Treasure Coast AI widget already initialized');
    return;
  }
  
  window.TreasureCoastAI = {
    initialized: false,
    config: {},
    iframe: null,
    bubble: null,
    isOpen: false
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
      clientId: currentScript.getAttribute('data-client-id') || '',
      botId: currentScript.getAttribute('data-bot-id') || '',
      primaryColor: currentScript.getAttribute('data-primary-color') || '#2563eb',
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      greeting: currentScript.getAttribute('data-greeting') || 'Hi! How can I help you today?',
      bubbleIcon: currentScript.getAttribute('data-bubble-icon') || 'chat',
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
  
  function createBubble(config) {
    var bubble = document.createElement('div');
    bubble.id = 'tcai-bubble';
    bubble.setAttribute('data-testid', 'widget-bubble');
    
    var positionStyles = getPositionStyles(config.position, 'bubble');
    
    bubble.style.cssText = [
      'position: fixed',
      'width: 60px',
      'height: 60px',
      'border-radius: 50%',
      'background: ' + config.primaryColor,
      'cursor: pointer',
      'box-shadow: 0 4px 20px rgba(0,0,0,0.3)',
      'z-index: 2147483646',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'transition: transform 0.2s ease, box-shadow 0.2s ease',
      positionStyles
    ].join(';');
    
    bubble.innerHTML = getChatIcon(config.bubbleIcon);
    
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
    var offset = element === 'bubble' ? '24px' : '100px';
    var windowOffset = element === 'bubble' ? '24px' : '24px';
    
    if (position.indexOf('bottom') !== -1) {
      styles.push('bottom: ' + windowOffset);
    } else {
      styles.push('top: ' + windowOffset);
    }
    
    if (position.indexOf('right') !== -1) {
      styles.push('right: ' + windowOffset);
    } else {
      styles.push('left: ' + windowOffset);
    }
    
    return styles.join(';');
  }
  
  function createIframe(config) {
    var iframe = document.createElement('iframe');
    iframe.id = 'tcai-iframe';
    iframe.setAttribute('data-testid', 'widget-iframe');
    
    var positionStyles = getPositionStyles(config.position, 'window');
    
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
      'background: #1a1a2e',
      positionStyles
    ].join(';');
    
    var params = new URLSearchParams({
      clientId: config.clientId,
      botId: config.botId,
      primaryColor: config.primaryColor,
      greeting: config.greeting
    });
    
    iframe.src = config.apiUrl + '/widget/frame.html?' + params.toString();
    
    iframe.onload = function() {
      iframe.contentWindow.postMessage({
        type: 'TCAI_CONFIG',
        config: config
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
    
    tcai.isOpen = true;
    tcai.iframe.style.opacity = '1';
    tcai.iframe.style.transform = 'translateY(0) scale(1)';
    tcai.iframe.style.pointerEvents = 'auto';
    tcai.bubble.innerHTML = getCloseIcon();
    
    tcai.iframe.contentWindow.postMessage({ type: 'TCAI_OPEN' }, '*');
  }
  
  function closeWidget() {
    var tcai = window.TreasureCoastAI;
    
    tcai.isOpen = false;
    tcai.iframe.style.opacity = '0';
    tcai.iframe.style.transform = 'translateY(20px) scale(0.95)';
    tcai.iframe.style.pointerEvents = 'none';
    tcai.bubble.innerHTML = getChatIcon(tcai.config.bubbleIcon);
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
    }
  }
  
  function init() {
    var config = getScriptConfig();
    
    if (!config.clientId || !config.botId) {
      console.error('Treasure Coast AI: Missing required data-client-id or data-bot-id attributes');
      return;
    }
    
    window.TreasureCoastAI.config = config;
    
    var bubble = createBubble(config);
    var iframe = createIframe(config);
    
    window.TreasureCoastAI.bubble = bubble;
    window.TreasureCoastAI.iframe = iframe;
    
    document.body.appendChild(bubble);
    document.body.appendChild(iframe);
    
    window.addEventListener('message', handleMessage);
    
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
