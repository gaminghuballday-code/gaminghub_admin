/**
 * Google OAuth utility functions
 * Loads Google Identity Services and handles OAuth flow
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: {
            theme?: string;
            size?: string;
            type?: string;
            text?: string;
          }) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

/**
 * Load Google Identity Services script
 */
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts) {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="accounts.google.com"]');
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

/**
 * Initialize Google OAuth and get ID token
 * Creates a hidden Google button and triggers it programmatically
 */
export const getGoogleIdToken = async (clientId: string): Promise<{ idToken: string; name?: string }> => {
  // Load Google script if not already loaded
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    try {
      let callbackExecuted = false;
      let buttonElement: HTMLElement | null = null;

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential: string }) => {
          if (callbackExecuted) return;
          callbackExecuted = true;

          // Clean up button
          if (buttonElement && buttonElement.parentNode) {
            buttonElement.parentNode.removeChild(buttonElement);
          }

          if (response.credential) {
            // Decode JWT to get user info
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              resolve({
                idToken: response.credential,
                name: payload.name || payload.given_name,
              });
            } catch (error) {
              resolve({
                idToken: response.credential,
              });
            }
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
      });

      // Create a hidden button element
      buttonElement = document.createElement('div');
      buttonElement.id = 'google-signin-trigger';
      buttonElement.style.position = 'fixed';
      buttonElement.style.top = '-9999px';
      buttonElement.style.left = '-9999px';
      buttonElement.style.opacity = '0';
      buttonElement.style.pointerEvents = 'none';
      document.body.appendChild(buttonElement);

      // Render Google button
      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
      });

      // Wait a bit for button to render, then trigger click
      setTimeout(() => {
        const googleButton = buttonElement?.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
          googleButton.click();
        } else {
          // Fallback: try to find any clickable element
          const clickable = buttonElement?.querySelector('[role="button"], button, a') as HTMLElement;
          if (clickable) {
            clickable.click();
          } else {
            reject(new Error('Failed to trigger Google sign-in'));
          }
        }
      }, 100);
    } catch (error: any) {
      reject(error);
    }
  });
};

/**
 * Alternative: Use One Tap or Button flow
 * This uses the newer Google Identity Services API
 */
export const signInWithGoogle = async (clientId: string): Promise<{ idToken: string; name?: string }> => {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    // Use the newer Credential API
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        try {
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          resolve({
            idToken: response.credential,
            name: payload.name || payload.given_name,
          });
        } catch (error) {
          resolve({
            idToken: response.credential,
          });
        }
      },
    });

    // Prompt the user to sign in
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to popup flow
        window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: (response: { credential: string }) => {
            if (response.credential) {
              try {
                const payload = JSON.parse(atob(response.credential.split('.')[1]));
                resolve({
                  idToken: response.credential,
                  name: payload.name || payload.given_name,
                });
              } catch (error) {
                resolve({
                  idToken: response.credential,
                });
              }
            } else {
              reject(new Error('No credential received'));
            }
          },
        }).requestAccessToken();
      }
    });
  });
};

