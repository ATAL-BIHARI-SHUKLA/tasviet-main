// Utility functions for cookie management

/**
 * Set a cookie with specified name, value, and options
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 */
export const setCookie = (name, value, options = {}) => {
  options = {
    path: '/',
    sameSite: 'None',
    secure: true, // Secure flag is required for SameSite=None
    maxAge: 60 * 60 * 24 * 30, // 30 days by default
    ...options
  };

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  for (const optionKey in options) {
    const optionValue = options[optionKey];
    if (optionValue === true) {
      cookieString += `; ${optionKey}`;
    } else if (optionValue !== false) {
      cookieString += `; ${optionKey}=${optionValue}`;
    }
  }

  document.cookie = cookieString;
};

/**
 * Get a cookie by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 * @param {Object} options - Cookie options
 */
export const deleteCookie = (name, options = {}) => {
  setCookie(name, '', { ...options, maxAge: -1 });
};

/**
 * Check if third-party cookies are enabled
 * @returns {Promise<boolean>} Promise resolving to true if third-party cookies are enabled
 */
export const checkThirdPartyCookiesEnabled = async () => {
  return new Promise((resolve) => {
    // Try setting a test cookie
    setCookie('thirdPartyCookieTest', 'test');
    
    // Check if the cookie was set
    setTimeout(() => {
      const cookieValue = getCookie('thirdPartyCookieTest');
      const cookiesEnabled = !!cookieValue;
      
      // Clean up the test cookie
      deleteCookie('thirdPartyCookieTest');
      
      resolve(cookiesEnabled);
    }, 100);
  });
};

/**
 * Initialize cookie consent and check for third-party cookie support
 */
export const initCookieConsent = async () => {
  const cookiesAccepted = localStorage.getItem('cookiesAccepted') === 'true';
  
  if (cookiesAccepted) {
    // Check if third-party cookies are enabled
    const thirdPartyCookiesEnabled = await checkThirdPartyCookiesEnabled();
    
    if (!thirdPartyCookiesEnabled) {
      console.warn('Third-party cookies are disabled. Some features may not work properly.');
      // You could display a warning to the user here
      return false;
    }
    
    return true;
  }
  
  return false;
};