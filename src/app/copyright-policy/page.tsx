import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "UniShare | Copyright Policy",
  description: "Copyright Policy for UniShare platform",
};

export default function CopyrightPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Copyright Policy</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                1. Respect for Copyright
              </h2>
              <p className="text-muted-foreground">
                UniShare respects the intellectual property rights of others and
                expects our users to do the same. We are committed to complying
                with copyright laws and protecting the rights of content
                creators.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                2. User Responsibilities
              </h2>
              <p className="text-muted-foreground">
                When using UniShare, you agree not to upload, share, or
                distribute any content that infringes upon the copyrights or
                other intellectual property rights of any person or entity. This
                includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>
                  Textbooks and published materials without proper permission
                </li>
                <li>
                  Proprietary course materials that prohibit redistribution
                </li>
                <li>
                  Software, code, or other digital content protected by
                  copyright
                </li>
                <li>
                  Academic papers, articles, or research that you do not have
                  rights to share
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Fair Use</h2>
              <p className="text-muted-foreground">
                UniShare recognizes the doctrine of fair use in educational
                contexts. However, users are responsible for ensuring their use
                of copyrighted materials falls within fair use guidelines. Fair
                use typically includes:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Limited portions of works for educational purposes</li>
                <li>Properly attributed citations and references</li>
                <li>Transformative use that adds new meaning or context</li>
                <li>
                  Use that does not diminish the market value of the original
                  work
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                4. DMCA Compliance
              </h2>
              <p className="text-muted-foreground">
                UniShare complies with the Digital Millennium Copyright Act
                (DMCA). If you believe your copyrighted work has been used on
                our platform in a way that constitutes copyright infringement,
                please submit a DMCA takedown notice to our designated copyright
                agent at copyright@unishare.com with the following information:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>
                  Identification of the copyrighted work claimed to be infringed
                </li>
                <li>
                  Identification of the material that is claimed to be
                  infringing
                </li>
                <li>Your contact information</li>
                <li>
                  A statement that you have a good faith belief that the use is
                  not authorized
                </li>
                <li>
                  A statement that the information is accurate and, under
                  penalty of perjury, that you are authorized to act on behalf
                  of the copyright owner
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. Counter-Notification
              </h2>
              <p className="text-muted-foreground">
                If you believe your content was removed due to a mistake or
                misidentification, you may submit a counter-notification with
                the following information:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                <li>Identification of the material that has been removed</li>
                <li>
                  A statement under penalty of perjury that you have a good
                  faith belief the material was removed as a result of mistake
                  or misidentification
                </li>
                <li>Your name, address, and telephone number</li>
                <li>
                  A statement that you consent to the jurisdiction of the
                  Federal District Court for the judicial district in which your
                  address is located
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                6. Repeat Infringers
              </h2>
              <p className="text-muted-foreground">
                UniShare maintains a policy of terminating the accounts of users
                who repeatedly infringe copyright or other intellectual property
                rights of others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                7. Educational Resources
              </h2>
              <p className="text-muted-foreground">
                We encourage users to familiarize themselves with copyright laws
                and best practices for academic resource sharing. If you are
                unsure whether sharing certain content would constitute
                copyright infringement, we recommend consulting your
                university's copyright policy or seeking legal advice.
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
