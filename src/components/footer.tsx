"use client";

import Link from "next/link";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/20 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Platform Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary bg-transparent border-none cursor-pointer p-0 m-0"
                  onClick={() => {
                    // Direct scroll without any router involvement
                    const featuresSection = document.getElementById("platform-features");
                    if (featuresSection) {
                      featuresSection.scrollIntoView({ behavior: "smooth" });
                    } else if (window.location.pathname !== "/") {
                      // If not on homepage, navigate to homepage with hash
                      window.location.href = "/#platform-features";
                    }
                  }}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary bg-transparent border-none cursor-pointer p-0 m-0"
                  onClick={() => {
                    // Direct scroll without any router involvement
                    const howItWorksSection = document.getElementById("how-it-works");
                    if (howItWorksSection) {
                      howItWorksSection.scrollIntoView({ behavior: "smooth" });
                    } else if (window.location.pathname !== "/") {
                      // If not on homepage, navigate to homepage with hash
                      window.location.href = "/#how-it-works";
                    }
                  }}
                >
                  How It Works
                </button>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/universities"
                  className="text-muted-foreground hover:text-primary"
                >
                  Universities
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard/resources"
                  className="text-muted-foreground hover:text-primary"
                >
                  Study Materials
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/study-groups"
                  className="text-muted-foreground hover:text-primary"
                >
                  Study Groups
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-tools"
                  className="text-muted-foreground hover:text-primary"
                >
                  AI Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/unblock-websites"
                  className="text-muted-foreground hover:text-primary"
                >
                  Unblock Websites
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help-center"
                  className="text-muted-foreground hover:text-primary"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/community-guidelines"
                  className="text-muted-foreground hover:text-primary"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary"
                >
                  Report Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://scorpisoft.com/#privacypolicy"
                  className="text-muted-foreground hover:text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/academic-integrity"
                  className="text-muted-foreground hover:text-primary"
                >
                  Academic Integrity
                </Link>
              </li>
              <li>
                <Link
                  href="/copyright-policy"
                  className="text-muted-foreground hover:text-primary"
                >
                  Copyright Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
          <div className="text-muted-foreground mb-4 md:mb-0">
            © {currentYear} UniShare. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <a
              href="https://twitter.com/useunishare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="https://facebook.com/useunishare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Facebook</span>
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="https://instagram.com/useunishare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Instagram</span>
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
