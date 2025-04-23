"use client";

import Link from "next/link";
import { ArrowUpRight, Check, BookOpen, Users, MapPin } from "lucide-react";
import ParticlesBackground from "./particles-background";
import { createClient } from "../../supabase/client";
import { useEffect, useState } from "react";

export default function Hero() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    // Check if user is logged in without using async/await directly in the effect
    const checkUser = () => {
      // Get the session first instead of trying to refresh it
      supabase.auth
        .getSession()
        .then(({ data: sessionData }) => {
          // Only try to refresh if we have a session
          if (sessionData.session) {
            supabase.auth.refreshSession().catch(() => {
              // Silent error handling
            });
          }

          // Get the user regardless of refresh result
          supabase.auth
            .getUser()
            .then(({ data, error }) => {
              if (error) {
                setUser(null);
              } else {
                setUser(data.user);
              }
            })
            .catch(() => {
              setUser(null);
            });
        })
        .catch(() => {
          setUser(null);
        });
    };

    // Also subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    checkUser();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return (
    <div
      className="relative overflow-hidden bg-background"
      style={{ position: "relative", isolation: "isolate", contain: "layout" }}
    >
      {/* Particles background - contained within hero section */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          height: "100%",
          zIndex: 0,
          contain: "strict",
          clipPath: "inset(0)",
        }}
        className="particles-wrapper"
      >
        <ParticlesBackground />
      </div>

      <div
        className="relative pt-24 pb-32 sm:pt-32 sm:pb-40"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-8 tracking-tight">
              Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                University
              </span>{" "}
              Resource Hub
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              An exclusive platform for university students to collaborate,
              share academic resources, and form study groups in a secure
              environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
                >
                  Go to Dashboard
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/verify-invite"
                  className="inline-flex items-center px-8 py-4 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
                >
                  Join With Invite Code
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>
              )}

              <button
                type="button"
                className="inline-flex items-center px-8 py-4 text-foreground bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-lg font-medium"
                onClick={() => {
                  // Direct scroll without any router involvement
                  const howItWorksSection = document.getElementById("how-it-works");
                  if (howItWorksSection) {
                    howItWorksSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                How It Works
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <BookOpen className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Resource Sharing</h3>
                <p className="text-muted-foreground text-center">
                  Access and share course notes, textbook solutions, and study
                  materials
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Study Groups</h3>
                <p className="text-muted-foreground text-center">
                  Create or join study groups with scheduling tools and
                  discussions
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <MapPin className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  University Specific
                </h3>
                <p className="text-muted-foreground text-center">
                  Exclusive access for verified students from your university
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
