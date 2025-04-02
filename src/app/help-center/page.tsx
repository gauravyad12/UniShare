import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "UniShare | Help Center",
  description: "Frequently asked questions about the UniShare platform",
};

export default function HelpCenterPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Help Center</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6">
                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    How do I join UniShare?
                  </h3>
                  <p className="text-muted-foreground">
                    UniShare is an invite-only platform for university students.
                    You need a valid university email address and an invitation
                    code to register. Visit our homepage and click on "Join Now"
                    to get started.
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    How can I share study materials?
                  </h3>
                  <p className="text-muted-foreground">
                    Once logged in, navigate to your dashboard and click on
                    "Upload Resource". You can upload various file types and add
                    relevant details like course name, description, and tags to
                    help others find your materials.
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    How do I join or create a study group?
                  </h3>
                  <p className="text-muted-foreground">
                    From your dashboard, go to the "Study Groups" section. You
                    can browse existing groups or create a new one by clicking
                    "Create Study Group". When creating a group, you can set it
                    as public or private and invite specific members.
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    Is my university email visible to other users?
                  </h3>
                  <p className="text-muted-foreground">
                    No, your email address is kept private. Other users can only
                    see your username, profile picture, university affiliation,
                    and any public information you choose to share on your
                    profile.
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    How can I customize my profile?
                  </h3>
                  <p className="text-muted-foreground">
                    Go to your dashboard and click on "Profile" or your username
                    in the top navigation. From there, you can edit your profile
                    information, upload a profile picture, and manage your
                    privacy settings.
                  </p>
                </div>

                <div className="bg-secondary/20 p-6 rounded-lg">
                  <h3 className="text-xl font-medium mb-2">
                    What should I do if I find inappropriate content?
                  </h3>
                  <p className="text-muted-foreground">
                    If you come across content that violates our community
                    guidelines, please report it immediately using the "Report"
                    option on the content or visit our Contact page to submit a
                    detailed report.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-6">
                If you couldn't find the answer to your question, please visit
                our contact page or check our community guidelines for more
                information.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="default">
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/community-guidelines">Community Guidelines</Link>
                </Button>
              </div>
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
