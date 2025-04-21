import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UniShare | Terms of Service",
  description: "Terms of Service for UniShare platform",
};

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using UniShare, you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do
                not use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground">
                UniShare is exclusively available to students with valid
                university email addresses and invitation codes. You must be at
                least 18 years old or the legal age of majority in your
                jurisdiction to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account. You agree to notify us immediately of any unauthorized
                use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
              <p className="text-muted-foreground">
                You retain ownership of any content you submit to UniShare. By
                posting content, you grant us a non-exclusive, worldwide,
                royalty-free license to use, reproduce, modify, and display your
                content for the purpose of operating and improving our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. Prohibited Activities
              </h2>
              <p className="text-muted-foreground">
                You agree not to engage in any activity that violates these
                terms, including but not limited to: sharing unauthorized
                copyrighted material, posting offensive content, attempting to
                gain unauthorized access to other accounts, or using the
                platform for any illegal purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your account at our
                discretion, particularly if we believe you have violated these
                terms or engaged in inappropriate behavior on our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                7. Changes to Terms
              </h2>
              <p className="text-muted-foreground">
                We may modify these terms at any time. Continued use of UniShare
                after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                UniShare is provided "as is" without warranties of any kind. We
                are not liable for any damages arising from your use of our
                platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
              <p className="text-muted-foreground">
                These terms are governed by the laws of the jurisdiction in
                which UniShare operates, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                10. Contact Information
              </h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us at
                support@unishare.com.
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
