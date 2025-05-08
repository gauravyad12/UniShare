"use client";

import Hero from "@/components/hero";
import ClientNavbar from "@/components/client-navbar";
import Footer from "@/components/footer";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Search,
  Users,
  Shield,
  GraduationCap,
  School,
  UserCheck,
  File,
  Check,
} from "lucide-react";
import { useEffect, useCallback } from "react";
import Link from "next/link";
import SuspenseSearchParams from "@/components/suspense-search-params";
import StructuredData from "@/components/structured-data";

export default function HomeClient() {
  // Handle search params changes
  const handleParamsChange = useCallback((params: URLSearchParams) => {
    // We don't need to do anything with the params here
    // Just having this function prevents the error
  }, []);

  // Add smooth scrolling behavior
  useEffect(() => {
    // Handle smooth scrolling for anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (
        anchor &&
        anchor.hash &&
        anchor.pathname === window.location.pathname
      ) {
        e.preventDefault();
        const targetElement = document.querySelector(anchor.hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
          // Update URL without page reload
          window.history.pushState(null, "", anchor.hash);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "UniShare",
    "url": "https://unishare.app",
    "description": "An exclusive platform for university students to collaborate, share academic resources, and form study groups in a secure environment.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://unishare.app/dashboard/resources?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "UniShare",
    "url": "https://unishare.app",
    "logo": "https://unishare.app/android-chrome-512x512.png",
    "sameAs": [
      "https://twitter.com/useunishare",
      "https://facebook.com/useunishare",
      "https://instagram.com/useunishare"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <StructuredData data={websiteStructuredData} />
      <StructuredData data={organizationStructuredData} />
      <SuspenseSearchParams onParamsChange={handleParamsChange} fallback={<div>Loading...</div>} />
      <ClientNavbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-card" id="platform-features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to excel in your academic journey, all in one
              secure platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <File className="w-6 h-6" />,
                title: "Resource Library",
                description:
                  "Access course notes, textbook solutions, and study guides",
              },
              {
                icon: <Check className="w-6 h-6" />,
                title: "University Verified",
                description:
                  "Exclusive access for students with valid university emails",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Study Groups",
                description:
                  "Create and join study groups with scheduling tools",
              },
              {
                icon: <Search className="w-6 h-6" />,
                title: "Smart Search",
                description: "Find materials by course, professor, or topic",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-background rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-secondary/20" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join your university's exclusive academic community in three
              simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative p-6 bg-card rounded-xl shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                1
              </div>
              <GraduationCap className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-center">
                Get an Invite
              </h3>
              <p className="text-muted-foreground text-center">
                Receive an invite code from a current member or university
                administrator
              </p>
            </div>

            <div className="relative p-6 bg-card rounded-xl shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                2
              </div>
              <Shield className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-center">
                Verify Email
              </h3>
              <p className="text-muted-foreground text-center">
                Sign up with your university email and verify your student
                status
              </p>
            </div>

            <div className="relative p-6 bg-card rounded-xl shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                3
              </div>
              <BookOpen className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-center">
                Start Collaborating
              </h3>
              <p className="text-muted-foreground text-center">
                Access resources, join study groups, and connect with classmates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card/80 border-y">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <School className="w-12 h-12 mb-4 text-primary" />
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-muted-foreground">Universities</div>
            </div>
            <div className="flex flex-col items-center">
              <UserCheck className="w-12 h-12 mb-4 text-primary" />
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-muted-foreground">Active Students</div>
            </div>
            <div className="flex flex-col items-center">
              <FileText className="w-12 h-12 mb-4 text-primary" />
              <div className="text-4xl font-bold mb-2">25,000+</div>
              <div className="text-muted-foreground">Shared Resources</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join UniShare?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get access to course materials, study groups, and a community of
            students from your university.
          </p>
          <Link
            href="/verify-invite"
            className="inline-flex items-center px-6 py-3 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Join With Invite Code
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
