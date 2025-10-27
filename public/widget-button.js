/**
 * Reserve4You Floating Button Widget
 * Version: 1.0
 * 
 * Usage: <script src="https://yourdomain.com/widget-button.js"></script>
 *        <div data-r4y-widget-button="YOUR_WIDGET_CODE"></div>
 */

(function() {
  'use strict';

  const API_BASE = window.R4Y_WIDGET_API || (window.location.origin + '/api/widget');

  // Track event
  function trackEvent(widgetCode, eventType, locationId) {
    try {
      fetch(API_BASE + '/' + widgetCode + '/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          location_id: locationId || null,
          referrer_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      }).catch(function() {});
    } catch (e) {}
  }

  // Create location card for modal
  function createLocationCard(location, config) {
    var imageUrl = location.image_url || location.hero_image_url;
    var city = location.city || (location.address_json && location.address_json.city) || '';
    var hasPromotion = config.show_promotions && location.promotions && location.promotions.length > 0;
    var promotion = hasPromotion ? location.promotions[0] : null;
    
    var html = '<div class="r4y-modal-card" style="border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'translateY(0)\'">'; 
    
    // Image
    html += '<div style="position: relative; height: 160px; overflow: hidden; background: #e5e7eb;">';
    if (imageUrl) {
      html += '<img src="' + imageUrl + '" alt="' + location.name + '" style="width: 100%; height: 100%; object-fit: cover;" />';
    }
    
    // Badges
    html += '<div style="position: absolute; top: 8px; left: 8px; display: flex; flex-direction: column; gap: 6px;">';
    if (config.show_cuisine && location.cuisine) {
      html += '<span style="padding: 3px 10px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 10px; font-size: 11px; font-weight: 500;">' + location.cuisine + '</span>';
    }
    if (location.has_deals) {
      html += '<span style="padding: 3px 10px; background: linear-gradient(135deg, #FF8C42, #F59E0B); color: white; border-radius: 10px; font-size: 11px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 140, 66, 0.3);">Aanbieding</span>';
    }
    html += '</div>';
    html += '</div>';
    
    // Content
    html += '<div style="padding: 12px;">';
    html += '<h4 style="font-size: 16px; font-weight: 600; margin: 0 0 6px 0; color: #1f2937;">' + location.name + '</h4>';
    
    // Info
    html += '<div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: #6b7280; margin-bottom: 10px;">';
    if (config.show_city && city) {
      html += '<span>' + city + '</span>';
    }
    if (config.show_price_range && location.price_range) {
      var euros = '';
      for (var i = 0; i < location.price_range; i++) euros += '€';
      html += '<span>' + euros + '</span>';
    }
    html += '</div>';
    
    // Promotion
    if (hasPromotion && promotion) {
      html += '<div style="padding: 8px; background: #ecfdf5; border-radius: 6px; margin-bottom: 10px;">';
      html += '<p style="margin: 0; font-size: 12px; font-weight: 600; color: #064e3b;">' + promotion.title + '</p>';
      html += '</div>';
    }
    
    // Button
    html += '<button class="r4y-modal-book-btn" data-location-slug="' + location.slug + '" data-location-id="' + location.id + '" style="width: 100%; padding: 8px; background: ' + config.booking_button_color + '; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">' + config.booking_button_text + '</button>';
    
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  // Show modal
  function showModal(widgetCode, config, locations) {
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'r4y-modal-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: r4y-fade-in 0.2s;';
    
    // Create modal
    var modal = document.createElement('div');
    modal.style.cssText = 'background: white; border-radius: 16px; max-width: 1200px; width: 100%; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: r4y-scale-in 0.2s; display: flex; flex-direction: column;';
    
    // Header
    var header = '<div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: between; flex-shrink: 0;">';
    if (config.logo_url) {
      header += '<img src="' + config.logo_url + '" alt="Logo" style="height: 32px; margin-right: auto;" />';
    } else {
      header += '<h3 style="font-size: 20px; font-weight: 600; margin: 0; margin-right: auto; color: #1f2937;">Kies een locatie</h3>';
    }
    header += '<button id="r4y-modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-center; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background=\'#f3f4f6\'" onmouseout="this.style.background=\'none\'">&times;</button>';
    header += '</div>';
    
    // Content
    var content = '<div style="padding: 24px; overflow-y: auto; flex: 1;">';
    content += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">';
    for (var i = 0; i < locations.length; i++) {
      content += createLocationCard(locations[i], config);
    }
    content += '</div>';
    content += '</div>';
    
    modal.innerHTML = header + content;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Track view
    trackEvent(widgetCode, 'view');
    
    // Close handlers
    document.getElementById('r4y-modal-close').onclick = function() {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    };
    
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      }
    };
    
    // Booking button handlers
    var bookBtns = modal.querySelectorAll('.r4y-modal-book-btn');
    bookBtns.forEach(function(btn) {
      btn.onclick = function() {
        var slug = this.getAttribute('data-location-slug');
        var locationId = this.getAttribute('data-location-id');
        
        trackEvent(widgetCode, 'click', locationId);
        trackEvent(widgetCode, 'booking_start', locationId);
        
        window.open(window.location.origin + '/p/' + slug, '_blank', 'width=800,height=900');
      };
      
      btn.onmouseover = function() { this.style.opacity = '0.9'; };
      btn.onmouseout = function() { this.style.opacity = '1'; };
    });
  }

  // Initialize button
  function initButton(container, widgetCode) {
    console.log('[R4Y Button] Initializing:', widgetCode);
    
    fetch(API_BASE + '/' + widgetCode)
      .then(function(response) {
        if (!response.ok) throw new Error('Widget not found');
        return response.json();
      })
      .then(function(data) {
        var config = data.config;
        var locations = data.locations || [];
        
        // Ensure button_text_position has a default value
        if (!config.button_text_position) {
          config.button_text_position = 'bottom';
        }
        
        console.log('[R4Y Button] Config loaded:', {
          button_text: config.button_text,
          button_text_position: config.button_text_position,
          flexDirection: config.button_text_position === 'top' ? 'column' : 'column-reverse'
        });
        
        // Create wrapper for button + text
        var wrapper = document.createElement('div');
        wrapper.className = 'r4y-button-wrapper';
        wrapper.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 999998; display: flex; flex-direction: ' + (config.button_text_position === 'top' ? 'column' : 'column-reverse') + '; align-items: center; gap: 8px;';
        
        // Create button
        var button = document.createElement('button');
        button.className = 'r4y-floating-button';
        button.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: ' + config.primary_color + '; color: white; border: none; box-shadow: 0 8px 24px rgba(0,0,0,0.15); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; font-size: 24px; overflow: hidden; padding: 0;';
        
        if (config.button_logo_url) {
          button.innerHTML = '<img src="' + config.button_logo_url + '" alt="Open" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />';
        } else {
          button.textContent = '+';
        }
        
        button.onmouseover = function() {
          this.style.transform = 'scale(1.1)';
          this.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
        };
        
        button.onmouseout = function() {
          this.style.transform = 'scale(1)';
          this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
        };
        
        button.onclick = function() {
          showModal(widgetCode, config, locations);
        };
        
        wrapper.appendChild(button);
        
        // Add text label if configured
        if (config.button_text) {
          var textContainer = document.createElement('div');
          textContainer.className = 'r4y-button-text-container';
          textContainer.style.cssText = 'position: relative; display: flex; align-items: center; justify-content: center;';
          
          var textLabel = document.createElement('span');
          textLabel.className = 'r4y-button-text';
          textLabel.textContent = config.button_text;
          textLabel.style.cssText = 'background: white; color: ' + config.primary_color + '; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 16px rgba(0,0,0,0.15); white-space: nowrap; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; position: relative; z-index: 1;';
          
          // Create arrow/tail pointing to button
          var arrow = document.createElement('div');
          arrow.className = 'r4y-button-text-arrow';
          
          console.log('[R4Y Button] Creating arrow with position:', config.button_text_position);
          
          if (config.button_text_position === 'top') {
            // Text is ABOVE button → Arrow points DOWN
            arrow.style.cssText = 'position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); z-index: 0;';
            console.log('[R4Y Button] Arrow pointing DOWN (▼)');
          } else {
            // Text is BELOW button → Arrow points UP
            arrow.style.cssText = 'position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid white; filter: drop-shadow(0 -2px 4px rgba(0,0,0,0.1)); z-index: 0;';
            console.log('[R4Y Button] Arrow pointing UP (▲)');
          }
          
          textLabel.appendChild(arrow);
          textContainer.appendChild(textLabel);
          
          textContainer.onmouseover = function() {
            textLabel.style.transform = 'scale(1.05)';
            textLabel.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
          };
          
          textContainer.onmouseout = function() {
            textLabel.style.transform = 'scale(1)';
            textLabel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
          };
          
          textContainer.onclick = function() {
            showModal(widgetCode, config, locations);
          };
          
          // Insert based on position
          if (config.button_text_position === 'top') {
            wrapper.insertBefore(textContainer, button);
            console.log('[R4Y Button] Text inserted BEFORE button (top position)');
          } else {
            wrapper.appendChild(textContainer);
            console.log('[R4Y Button] Text appended AFTER button (bottom position)');
          }
        }
        
        container.appendChild(wrapper);
        console.log('[R4Y Button] Rendered successfully!', {
          hasText: !!config.button_text,
          text: config.button_text || 'none',
          position: config.button_text_position
        });
      })
      .catch(function(error) {
        console.error('[R4Y Button] Error:', error);
      });
  }

  // Initialize all buttons
  function initAllButtons() {
    var containers = document.querySelectorAll('[data-r4y-widget-button]');
    console.log('[R4Y Button] Found', containers.length, 'button(s)');
    
    containers.forEach(function(container) {
      var widgetCode = container.getAttribute('data-r4y-widget-button');
      if (widgetCode) {
        initButton(container, widgetCode);
      }
    });
  }

  // Add animations
  var style = document.createElement('style');
  style.textContent = `
    @keyframes r4y-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes r4y-scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllButtons);
  } else {
    initAllButtons();
  }

  // Expose global function
  window.R4Y = window.R4Y || {};
  window.R4Y.loadButton = function(elementId, widgetCode) {
    var container = document.getElementById(elementId);
    if (container) {
      initButton(container, widgetCode);
    }
  };

  console.log('[R4Y Button] Script loaded successfully');

})();

