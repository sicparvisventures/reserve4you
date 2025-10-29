/**
 * Reserve4You Widget Embed Script
 * Version: 2.0
 * Usage: <script src="https://yourdomain.com/widget-embed.js"></script>
 *        <div data-r4y-widget="YOUR_WIDGET_CODE"></div>
 */

(function() {
  'use strict';

  // Configuration
  const API_BASE = window.R4Y_WIDGET_API || (window.location.origin + '/api/widget');

  // Track widget event
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
      }).catch(function() {}); // Silently fail
    } catch (e) {}
  }

  // Create location card HTML
  function createLocationCard(location, config) {
    var imageUrl = location.image_url || location.hero_image_url;
    var city = location.city || (location.address_json && location.address_json.city) || '';
    var hasPromotion = config.show_promotions && location.promotions && location.promotions.length > 0;
    var promotion = hasPromotion ? location.promotions[0] : null;
    
    var html = '<div class="r4y-location-card" style="border-radius: ' + config.corner_radius + 'px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: all 0.3s; cursor: pointer;">';
    
    // Image
    html += '<div style="position: relative; height: 192px; overflow: hidden; background: linear-gradient(135deg, #f5f5f5, #e0e0e0);">';
    if (imageUrl) {
      html += '<img src="' + imageUrl + '" alt="' + location.name + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src=\'/raylogo.png\'; this.style.objectFit=\'contain\'; this.style.padding=\'32px\';" />';
    } else {
      html += '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 32px;"><img src="/raylogo.png" alt="Reserve4You" style="width: 100%; height: 100%; object-fit: contain;" /></div>';
    }
    
    // Badges
    html += '<div style="position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 8px;">';
    if (config.show_cuisine && location.cuisine) {
      html += '<span style="padding: 4px 12px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-radius: 12px; font-size: 12px; font-weight: 500;">' + location.cuisine + '</span>';
    }
    if (location.has_deals) {
      html += '<span style="padding: 4px 12px; background: linear-gradient(135deg, #FF8C42, #F59E0B); color: white; border-radius: 12px; font-size: 12px; font-weight: 500; box-shadow: 0 2px 4px rgba(255, 140, 66, 0.3);">Aanbieding</span>';
    }
    html += '</div>';
    html += '</div>';
    
    // Content
    html += '<div style="padding: 16px;">';
    html += '<h3 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0; color: #1f2937;">' + location.name + '</h3>';
    
    // Location info
    html += '<div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #6b7280; margin-bottom: 12px;">';
    if (config.show_city && city) {
      html += '<span>' + city + '</span>';
    }
    if (config.show_price_range && location.price_range) {
      var euros = '';
      for (var i = 0; i < location.price_range; i++) {
        euros += '€';
      }
      html += '<span>' + euros + '</span>';
    }
    html += '</div>';
    
    // Description
    if (config.show_description && location.description) {
      html += '<p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">' + location.description + '</p>';
    }
    
    // Promotion
    if (hasPromotion && promotion) {
      html += '<div style="padding: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 12px;">';
      html += '<p style="margin: 0; font-size: 14px; font-weight: 600; color: #064e3b;">' + promotion.title + '</p>';
      if (promotion.description) {
        html += '<p style="margin: 4px 0 0 0; font-size: 12px; color: #065f46;">' + promotion.description + '</p>';
      }
      html += '</div>';
    }
    
    // Booking button
    html += '<button class="r4y-book-btn" data-location-slug="' + location.slug + '" data-location-id="' + location.id + '" style="width: 100%; padding: 10px 16px; background: ' + config.booking_button_color + '; color: white; border: none; border-radius: ' + config.corner_radius + 'px; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity 0.2s;">';
    html += config.booking_button_text;
    html += '</button>';
    
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  // Initialize widget
  function initWidget(container, widgetCode) {
    console.log('[R4Y Widget] Initializing:', widgetCode);
    
    // Show loading
    container.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; padding: 48px;"><div style="width: 32px; height: 32px; border: 3px solid #f3f4f6; border-top-color: #3b82f6; border-radius: 50%; animation: r4y-spin 1s linear infinite;"></div></div>';
    
    // Fetch widget data
    fetch(API_BASE + '/' + widgetCode)
      .then(function(response) {
        if (!response.ok) throw new Error('Widget not found');
        return response.json();
      })
      .then(function(data) {
        console.log('[R4Y Widget] Data loaded:', data);
        
        var config = data.config;
        var locations = data.locations || [];
        
        // Track view
        trackEvent(widgetCode, 'view');
        
        // Build widget HTML
        var html = '<div class="r4y-widget" style="max-width: ' + config.max_width + 'px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;">';
        
        // Logo
        if (config.show_logo && config.logo_url) {
          var logoAlign = config.logo_position === 'center' ? 'center' : config.logo_position === 'left' ? 'flex-start' : 'center';
          html += '<div style="display: flex; justify-content: ' + logoAlign + '; margin-bottom: 24px;">';
          html += '<img src="' + config.logo_url + '" alt="' + config.widget_name + '" style="max-height: 48px;" />';
          html += '</div>';
        }
        
        // Locations grid
        if (locations.length > 0) {
          html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">';
          for (var i = 0; i < locations.length; i++) {
            html += createLocationCard(locations[i], config);
          }
          html += '</div>';
        } else {
          html += '<div style="text-align: center; padding: 48px; color: #6b7280;"><p>Geen restaurants beschikbaar</p></div>';
        }
        
        html += '</div>';
        
        // Render
        container.innerHTML = html;
        
        // Add event listeners
        var buttons = container.querySelectorAll('.r4y-book-btn');
        buttons.forEach(function(btn) {
          btn.addEventListener('click', function() {
            var slug = this.getAttribute('data-location-slug');
            var locationId = this.getAttribute('data-location-id');
            
            trackEvent(widgetCode, 'click', locationId);
            trackEvent(widgetCode, 'booking_start', locationId);
            
            var bookingUrl = window.location.origin + '/p/' + slug;
            window.open(bookingUrl, '_blank', 'width=800,height=900');
          });
          
          // Hover effect
          if (config.enable_hover_effects) {
            btn.addEventListener('mouseenter', function() {
              this.style.opacity = '0.9';
            });
            btn.addEventListener('mouseleave', function() {
              this.style.opacity = '1';
            });
          }
        });
        
        console.log('[R4Y Widget] Rendered successfully');
      })
      .catch(function(error) {
        console.error('[R4Y Widget] Error:', error);
        container.innerHTML = '<div style="padding: 24px; text-align: center; color: #ef4444;"><p>Widget kon niet worden geladen</p></div>';
      });
  }

  // Initialize all widgets on page
  function initAllWidgets() {
    var containers = document.querySelectorAll('[data-r4y-widget]');
    console.log('[R4Y Widget] Found', containers.length, 'widget(s)');
    
    containers.forEach(function(container) {
      var widgetCode = container.getAttribute('data-r4y-widget');
      if (widgetCode) {
        initWidget(container, widgetCode);
      }
    });
  }

  // Add spinner animation
  var style = document.createElement('style');
  style.textContent = '@keyframes r4y-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllWidgets);
  } else {
    initAllWidgets();
  }

  // Expose global function for dynamic loading
  window.R4Y = window.R4Y || {};
  window.R4Y.loadWidget = function(elementId, widgetCode) {
    var container = document.getElementById(elementId);
    if (container) {
      initWidget(container, widgetCode);
    }
  };

  console.log('[R4Y Widget] Script loaded successfully');

})();
