"use client";

import { useCallback, useEffect } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function ParticlesBackground() {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  // Add a style element to fix Chrome-specific issues
  useEffect(() => {
    // Create a style element for browser-specific fixes
    const styleElement = document.createElement("style");
    styleElement.id = "particles-chrome-fix";
    styleElement.textContent = `
      /* Fix for Chrome to contain particles within the hero section */
      #tsparticles {
        contain: strict;
        isolation: isolate;
        overflow: hidden;
        clip-path: inset(0);
      }

      /* Ensure the container is properly contained */
      .particles-container {
        contain: content;
        isolation: isolate;
        overflow: hidden;
      }
    `;

    // Add the style element to the document head
    if (!document.getElementById("particles-chrome-fix")) {
      document.head.appendChild(styleElement);
    }

    // Clean up function
    return () => {
      const existingStyle = document.getElementById("particles-chrome-fix");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className="particles-container" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
        background: {
          color: {
            value: "transparent",
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            push: {
              quantity: 2,
            },
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: "#6366f1",
          },
          links: {
            color: "#6366f1",
            distance: 150,
            enable: true,
            opacity: 0.4,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 1,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 40,
          },
          opacity: {
            value: 0.7,
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.1,
              sync: false,
            },
          },
          shape: {
            type: "image",
            options: {
              image: [
                {
                  src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>",
                  width: 24,
                  height: 24,
                  replaceColor: true,
                },
                {
                  src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 10v6M2 10l10-5 10 5-10 5z'/><path d='M6 12v5c0 2 2 3 6 3s6-1 6-3v-5'/></svg>",
                  width: 24,
                  height: 24,
                  replaceColor: true,
                },
                {
                  src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'/><path d='m15 5 4 4'/></svg>",
                  width: 24,
                  height: 24,
                  replaceColor: true,
                },
                {
                  src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z'/><path d='M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z'/><path d='M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4'/><path d='M17.599 6.5a3 3 0 0 0 .399-1.375'/><path d='M6.003 5.125A3 3 0 0 0 6.401 6.5'/><path d='M3.477 10.896a4 4 0 0 1 .585-.396'/><path d='M19.938 10.5a4 4 0 0 1 .585.396'/><path d='M6 18a4 4 0 0 1-1.967-.516'/><path d='M19.967 17.484A4 4 0 0 1 18 18'/></svg>",
                  width: 24,
                  height: 24,
                  replaceColor: true,
                },
              ],
            },
          },
          size: {
            value: { min: 12, max: 20 },
          },
        },
        detectRetina: true,
      }}
      className="absolute inset-0 z-0"
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        contain: "strict",
        overflow: "hidden",
      }}
    />
    </div>
  );
}
