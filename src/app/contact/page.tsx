export const metadata = {
  title: "UniShare | Contact Us",
  description: "Get in touch with the UniShare team for support or inquiries",
};

import ContactForm from "@/components/contact-form";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

          <div className="space-y-8">
            <section>
              <p className="text-muted-foreground mb-6">
                Have a question, suggestion, or need to report an issue? We're
                here to help! Fill out the form below and our team will get back
                to you as soon as possible.
              </p>

              <ContactForm />
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Other Ways to Reach Us
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">Email Support</h3>
                  <p className="text-muted-foreground">
                    For general inquiries:{" "}
                    <span className="text-foreground">
                      support@unishare.com
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    For urgent issues:{" "}
                    <span className="text-foreground">urgent@unishare.com</span>
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">Social Media</h3>
                  <p className="text-muted-foreground">
                    Follow us on social media for updates and to send us direct
                    messages:
                  </p>
                  <div className="flex space-x-4 mt-2">
                    <Link
                      href="https://twitter.com/useunishare"
                      className="text-foreground hover:text-primary flex items-center gap-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-5 w-5" /> Twitter
                    </Link>
                    <Link
                      href="https://facebook.com/useunishare"
                      className="text-foreground hover:text-primary flex items-center gap-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-5 w-5" /> Facebook
                    </Link>
                    <Link
                      href="https://instagram.com/useunishare"
                      className="text-foreground hover:text-primary flex items-center gap-2"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="h-5 w-5" /> Instagram
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mb-4">
                Before contacting us, you might find the answer to your question
                in our Help Center.
              </p>
              <Button asChild variant="outline">
                <Link href="/help-center">Visit Help Center</Link>
              </Button>
            </section>
          </div>

          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
