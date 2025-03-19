import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Academic Integrity Policy - UniShare",
  description: "Academic Integrity Policy for UniShare platform",
};

export default function AcademicIntegrityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Academic Integrity Policy</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
              <p className="text-muted-foreground">
                UniShare is committed to fostering an environment of academic
                integrity and ethical conduct. We believe in supporting
                students' educational journeys while upholding the highest
                standards of academic honesty.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <p className="text-muted-foreground">
                UniShare is designed to facilitate collaborative learning,
                resource sharing, and study group formation. Resources shared on
                our platform should be used for:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Reference and research purposes</li>
                <li>Study aid and exam preparation</li>
                <li>Understanding complex concepts</li>
                <li>Collaborative learning with peers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Prohibited Activities
              </h2>
              <p className="text-muted-foreground">
                The following activities violate our academic integrity policy:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>
                  Submitting shared materials as your own work (plagiarism)
                </li>
                <li>
                  Sharing exam questions or answers during active examination
                  periods
                </li>
                <li>
                  Posting solutions to current assignments without proper
                  authorization
                </li>
                <li>
                  Using the platform to engage in any form of academic
                  dishonesty
                </li>
                <li>
                  Sharing materials explicitly prohibited by your institution
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Resource Guidelines
              </h2>
              <p className="text-muted-foreground">
                When sharing resources on UniShare, users should:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Properly cite all sources and references</li>
                <li>Respect copyright and intellectual property rights</li>
                <li>
                  Clearly indicate if materials are from previous terms/years
                </li>
                <li>
                  Obtain permission before sharing materials created by
                  professors or teaching assistants
                </li>
                <li>
                  Follow your institution's specific policies regarding resource
                  sharing
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Reporting Violations
              </h2>
              <p className="text-muted-foreground">
                If you believe content on UniShare violates academic integrity
                standards, please report it immediately. We take all reports
                seriously and will investigate promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Consequences of Violations
              </h2>
              <p className="text-muted-foreground">
                Violations of our academic integrity policy may result in:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Removal of the violating content</li>
                <li>Temporary or permanent suspension of user accounts</li>
                <li>Reporting to the relevant university authorities</li>
                <li>Revocation of platform access privileges</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Institutional Policies
              </h2>
              <p className="text-muted-foreground">
                UniShare users must adhere to their own institution's academic
                integrity policies in addition to our platform guidelines. In
                cases of conflict, the stricter policy applies.
              </p>
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
