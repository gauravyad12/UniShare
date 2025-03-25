export function registerNavigationEvents() {
  if (typeof window !== "undefined") {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState
    history.pushState = function () {
      document.dispatchEvent(new Event("navigationStart"));
      const result = originalPushState.apply(this, arguments);
      setTimeout(() => {
        document.dispatchEvent(new Event("navigationComplete"));
      }, 100);
      return result;
    };

    // Override replaceState
    history.replaceState = function () {
      document.dispatchEvent(new Event("navigationStart"));
      const result = originalReplaceState.apply(this, arguments);
      setTimeout(() => {
        document.dispatchEvent(new Event("navigationComplete"));
      }, 100);
      return result;
    };

    // Handle back/forward navigation
    window.addEventListener("popstate", () => {
      document.dispatchEvent(new Event("navigationStart"));
      setTimeout(() => {
        document.dispatchEvent(new Event("navigationComplete"));
      }, 100);
    });
  }
}
