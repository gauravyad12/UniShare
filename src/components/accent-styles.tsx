"use client";

export function AccentStyles() {
  return (
    <style jsx global>{`
      :root {
        --accent-color: rgb(59, 130, 246); /* Default blue */
      }

      /* Custom accent color classes */
      .text-accent {
        color: var(--accent-color);
      }
      .bg-accent {
        background-color: var(--accent-color);
      }
      .border-accent {
        border-color: var(--accent-color);
      }

      /* Override primary color with accent */
      [data-accent] .text-primary {
        color: var(--accent-color);
      }
      [data-accent] .bg-primary {
        background-color: var(--accent-color);
      }
      [data-accent] .border-primary {
        border-color: var(--accent-color);
      }
      [data-accent] .hover\:bg-primary:hover {
        background-color: var(--accent-color);
      }
      [data-accent] .hover\:text-primary:hover {
        color: var(--accent-color);
      }
      [data-accent] .hover\:border-primary:hover {
        border-color: var(--accent-color);
      }
    `}</style>
  );
}
