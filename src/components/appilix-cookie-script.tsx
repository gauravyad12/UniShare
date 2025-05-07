'use client';

/**
 * Component that injects a script to read the Appilix identity cookie
 * and set the global variable for push notifications
 */
export default function AppilixCookieScript() {
  // Script to read the cookie and set the Appilix identity variable
  const scriptContent = `
    (function() {
      try {
        // Function to get a cookie value by name
        function getCookie(name) {
          const value = \`; \${document.cookie}\`;
          const parts = value.split(\`; \${name}=\`);
          if (parts.length === 2) {
            return decodeURIComponent(parts.pop().split(';').shift());
          }
          return null;
        }

        // Get the Appilix identity from the cookie
        const identityCookie = getCookie('appilix_push_notification_user_identity');

        // Set the global variable if the cookie exists
        if (identityCookie) {
          window.appilix_push_notification_user_identity = identityCookie;
        }
      } catch (error) {
        // Silent error handling
      }
    })();
  `;

  return (
    <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
  );
}
