// Theme utility functions for consistent theme handling

// Color definitions with HSL values for better theme integration
export const themeColors = {
  default: {
    light: "0 0% 9%", // Default primary in light mode
    dark: "0 0% 98%", // Default primary in dark mode
  },
  blue: {
    light: "221.2 83.2% 53.3%",
    dark: "217.2 91.2% 59.8%",
  },
  yellow: {
    light: "47.9 95.8% 53.1%",
    dark: "47.9 95.8% 53.1%",
  },
  pink: {
    light: "328.6 85.5% 70.2%",
    dark: "328.6 85.5% 70.2%",
  },
  purple: {
    light: "262.1 83.3% 57.8%",
    dark: "262.1 83.3% 57.8%",
  },
  orange: {
    light: "24.6 95% 53.1%",
    dark: "24.6 95% 53.1%",
  },
  green: {
    light: "142.1 76.2% 36.3%",
    dark: "142.1 76.2% 36.3%",
  },
};

// Helper function to apply theme class to document
function applyThemeClass(theme: string) {
  if (typeof window === "undefined") return;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else if (theme === "light") {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  } else if (theme === "system") {
    // Use a try-catch to handle potential errors with matchMedia
    try {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error("Error detecting system theme:", error);
      // Fallback to light theme
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }
}

// Apply theme to document with proper CSS variables
export function applyThemeToDocument(
  theme: string,
  color: string,
  fontSize: number,
) {
  if (typeof window === "undefined") return;

  // Apply theme class
  applyThemeClass(theme);

  // Apply accent color (only once)
  if (color === "default") {
    document.documentElement.removeAttribute("data-accent");
  } else {
    document.documentElement.setAttribute("data-accent", color);
  }

  // Apply font size to document root for all pages
  const rootSize = 16 + (fontSize - 2) * 1; // Base size is 16px, each step changes by 1px
  document.documentElement.style.fontSize = `${rootSize}px`;

  // Find the dashboard container
  const dashboardContainer = document.querySelector(".dashboard-styles");

  if (dashboardContainer) {
    // Always set the data-accent attribute on the dashboard container
    if (color !== "default") {
      dashboardContainer.setAttribute("data-accent", color);
    } else {
      dashboardContainer.removeAttribute("data-accent");
    }

    // Apply font size directly to dashboard container
    dashboardContainer.style.fontSize = `${rootSize}px`;
  }
}

// Save theme to localStorage for persistence
export function saveThemeToStorage(theme: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("theme", theme);

  // Also update the HTML class immediately for consistency
  applyThemeClass(theme);
}

// Broadcast theme change to other tabs/windows
export function broadcastThemeChange(theme: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "theme",
      newValue: theme,
      storageArea: localStorage,
    }),
  );
}
