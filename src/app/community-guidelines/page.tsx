import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "UniShare | Community Guidelines",
  description:
    "Guidelines for the UniShare community to ensure a positive and productive environment",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Community Guidelines</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Our Community Values
              </h2>
              <p className="text-muted-foreground">
                UniShare is built on the principles of collaboration, respect,
                and academic integrity. We strive to create a supportive
                environment where university students can share knowledge,
                resources, and experiences to enhance their educational journey.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">General Conduct</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <span className="text-foreground font-medium">
                    Be respectful:
                  </span>{" "}
                  Treat all community members with respect and courtesy,
                  regardless of background, identity, or viewpoint.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Be constructive:
                  </span>{" "}
                  Aim to contribute positively to discussions and resource
                  sharing.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Be honest:
                  </span>{" "}
                  Represent yourself and your contributions truthfully.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Be supportive:
                  </span>{" "}
                  Help fellow students when you can and foster a collaborative
                  atmosphere.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Be mindful:
                  </span>{" "}
                  Consider how your words and actions might affect others in the
                  community.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Content Guidelines
              </h2>
              <h3 className="text-xl font-medium mb-2">Acceptable Content</h3>
              <ul className="list-disc pl-6 mb-4 text-muted-foreground">
                <li>Study notes, summaries, and guides</li>
                <li>Practice problems and solutions from past years</li>
                <li>Educational resources and references</li>
                <li>Academic discussions and questions</li>
                <li>Study tips and learning strategies</li>
              </ul>

              <h3 className="text-xl font-medium mb-2">Prohibited Content</h3>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Current exam questions or answers</li>
                <li>Plagiarized or copyright-infringing material</li>
                <li>
                  Solutions to current assignments without proper authorization
                </li>
                <li>Content that promotes academic dishonesty</li>
                <li>Discriminatory, offensive, or harassing content</li>
                <li>Spam, advertisements, or unrelated commercial content</li>
                <li>Personal or sensitive information about others</li>
                <li>Malicious links or files</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Study Group Etiquette
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Respect the purpose and rules of each study group</li>
                <li>Contribute meaningfully to group discussions</li>
                <li>Honor commitments to group activities and deadlines</li>
                <li>
                  Maintain confidentiality of group discussions when appropriate
                </li>
                <li>Be inclusive and welcoming to all group members</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Academic Integrity
              </h2>
              <p className="text-muted-foreground mb-4">
                UniShare is committed to upholding academic integrity. All users
                must adhere to their university's academic policies and our
                platform's academic integrity guidelines.
              </p>
              <Button asChild variant="outline" className="mb-4">
                <Link href="/academic-integrity">
                  View Academic Integrity Policy
                </Link>
              </Button>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Reporting Violations
              </h2>
              <p className="text-muted-foreground mb-4">
                If you encounter content or behavior that violates these
                guidelines, please report it immediately. We take all reports
                seriously and will investigate promptly.
              </p>
              <Button asChild>
                <Link href="/contact">Report a Violation</Link>
              </Button>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Consequences of Violations
              </h2>
              <p className="text-muted-foreground">
                Violations of our community guidelines may result in:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Content removal</li>
                <li>Warnings</li>
                <li>Temporary restrictions</li>
                <li>Account suspension or termination</li>
                <li>Reporting to university authorities in severe cases</li>
              </ul>
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
