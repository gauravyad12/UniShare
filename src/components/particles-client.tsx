"use client";

import { useCallback, useEffect, useState, memo, useRef } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { type Container, type Engine } from "@tsparticles/engine";

// Module-level variables to track initialization state and container
// This ensures we only initialize the engine once across all instances
let isEngineInitializedGlobally = false;
let globalContainerInstance: Container | null = null;
let initializationInProgress = false;
let mountCount = 0;

// This component will only be rendered on the client
function ParticlesClient() {
  const [init, setInit] = useState(false);

  // Refs to track component state
  const mountedRef = useRef(true);
  const instanceIdRef = useRef(Math.random().toString(36).substring(2, 9));
  const themeChangeCountRef = useRef(0);

  // Use a stable options object to prevent unnecessary re-renders
  // Define this at the top level to ensure hooks are called in the same order
  const options = useRef({
    detectRetina: false,
    fullScreen: {
      enable: false,
      zIndex: 0
    },
    background: {
      color: {
        value: "",
      },
      opacity: 0,
      image: "",
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
        resize: {
          enable: true,
        },
      },
      modes: {
        push: {
          quantity: 4,
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
        distance: 200,
        enable: true,
        opacity: 0.6,
        width: 1.5,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "out",
        },
        random: false,
        speed: 0.8,
        straight: false,
        attract: {
          enable: true,
          rotate: {
            x: 600,
            y: 1200
          },
        },
      },
      number: {
        density: {
          enable: true,
        },
        value: 80,
      },
      opacity: {
        value: {
          min: 0.4,
          max: 0.8
        },
        animation: {
          enable: true,
          speed: 0.5,
          sync: false
        }
      },
      shape: {
        type: "image",
        options: {
          image: [
            {
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/><path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/></svg>",
              width: 24,
              height: 24,
            },
            {
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M22 10v6M2 10l10-5 10 5-10 5z'/><path d='M6 12v5c0 2 2 3 6 3s6-1 6-3v-5'/></svg>",
              width: 24,
              height: 24,
            },
            {
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'/><path d='m15 5 4 4'/></svg>",
              width: 24,
              height: 24,
            },
            {
              src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z'/><path d='M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z'/></svg>",
              width: 24,
              height: 24,
            },
          ],
        },
      },
      size: {
        value: { min: 12, max: 20 },
      },
    },
  }).current;

  // Track theme changes to detect if remount is due to theme change
  // This must be the first useEffect to ensure consistent hook order
  useEffect(() => {
    const handleThemeChange = () => {
      themeChangeCountRef.current += 1;
    };

    // Listen for theme class changes on document
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' &&
            ((mutation.target as Element).classList.contains('dark') ||
             (mutation.target as Element).classList.contains('light'))) {
          handleThemeChange();
        }
      });
    });

    // Only observe if we're in the browser
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // This should be run only once per application lifetime
  useEffect(() => {
    // Increment mount count
    mountCount += 1;

    // Create a unique ID for this instance
    const instanceId = instanceIdRef.current;
    console.log(`Particles instance ${instanceId} mounting (mount #${mountCount}, theme changes: ${themeChangeCountRef.current})`);

    const initializeParticles = async () => {
      // If we already have a global container and this is a remount due to theme change,
      // just reuse it without reinitializing
      if (globalContainerInstance && themeChangeCountRef.current > 0) {
        console.log(`Particles instance ${instanceId} reusing existing container due to theme change`);
        setInit(true);
        return;
      }

      // Check if already initialized globally
      if (isEngineInitializedGlobally) {
        console.log(`Particles instance ${instanceId} using existing global engine`);
        setInit(true);
        return;
      }

      // Check if initialization is already in progress
      if (initializationInProgress) {
        console.log(`Particles instance ${instanceId} waiting for initialization in progress`);

        // Wait for initialization to complete
        const checkInterval = setInterval(() => {
          if (isEngineInitializedGlobally && !initializationInProgress) {
            clearInterval(checkInterval);
            if (mountedRef.current) {
              console.log(`Particles instance ${instanceId} detected initialization completed`);
              setInit(true);
            }
          }
        }, 100);

        return;
      }

      // Only initialize if not already done globally
      try {
        console.log(`Particles instance ${instanceId} initializing global engine`);

        // Set flags before async operation to prevent race conditions
        initializationInProgress = true;
        isEngineInitializedGlobally = true;

        await initParticlesEngine(async (engine: Engine) => {
          await loadFull(engine);
        });

        if (mountedRef.current) {
          console.log(`Particles instance ${instanceId} initialized global engine successfully`);
          setInit(true);
        }

        // Reset initialization flag
        initializationInProgress = false;
      } catch (error) {
        console.error(`Particles instance ${instanceId} initialization error:`, error);
        // Reset the flags if initialization fails
        isEngineInitializedGlobally = false;
        initializationInProgress = false;
      }
    };

    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      // Use requestAnimationFrame to ensure we're in a render cycle
      requestAnimationFrame(() => {
        if (mountedRef.current) {
          initializeParticles();
        }
      });
    }

    // Cleanup function
    return () => {
      console.log(`Particles instance ${instanceId} unmounting`);
      mountedRef.current = false;

      // Decrement mount count
      mountCount -= 1;

      // If this is the last instance being unmounted and not due to theme change,
      // clean up the global container
      if (mountCount === 0 && themeChangeCountRef.current === 0 && globalContainerInstance) {
        console.log(`Last particles instance unmounted, cleaning up global container`);
        globalContainerInstance = null;
      }
    };
  }, []);

  // This callback is called when the particles container is loaded
  // It must be defined with useCallback to ensure it's stable across renders
  const particlesLoaded = useCallback(async (container?: Container) => {
    // Generate a unique ID for this container
    const containerId = Math.random().toString(36).substring(2, 9);

    if (process.env.NODE_ENV === 'development') {
      console.log(`Particles container ${containerId} loaded successfully (theme changes: ${themeChangeCountRef.current})`);
    }

    // Store container reference globally for reuse
    if (container && !globalContainerInstance) {
      globalContainerInstance = container;
      console.log(`Stored global container reference ${containerId}`);
    }

    // Store container reference for potential cleanup
    if (container && typeof document !== 'undefined') {
      // Add event listener for visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log(`Tab visible again, refreshing particles container ${containerId}`);
          try {
            // Pause and resume to reset particle positions
            container.pause();
            setTimeout(() => {
              if (container) {
                container.play();
              }
            }, 50);
          } catch (e) {
            console.error(`Error resetting particles on tab visibility for container ${containerId}:`, e);
          }
        }
      };

      // Add visibility change listener
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Return cleanup function from callback
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        console.log(`Particles container ${containerId} cleanup`);
      };
    }
  }, [themeChangeCountRef]);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
    />
  );
}

// Export a memoized version of the component
export default memo(ParticlesClient);
