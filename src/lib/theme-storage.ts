// Simple theme storage utility
export const ThemeStorage = {
  saveTheme: (theme: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("theme", theme);
  },

  getTheme: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("theme");
  },
};
