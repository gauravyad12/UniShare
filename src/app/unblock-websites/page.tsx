import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Globe, Lock, Shield, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Unblock Websites - UniShare",
  description:
    "Access educational resources and research materials blocked by university networks",
};

export default function UnblockWebsitesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">
            Unblock Educational Websites
          </h1>
          <p className="text-muted-foreground mb-8">
            Access important educational resources and research materials that
            may be restricted on your university network. Our secure proxy
            service helps you bypass network restrictions for academic purposes
            only.
          </p>

          <div className="bg-secondary/20 p-6 rounded-lg mb-12">
            <h2 className="text-xl font-semibold mb-4">Enter Website URL</h2>
            <p className="text-muted-foreground mb-4">
              Enter the URL of the educational website you need to access for
              your research or studies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="https://example.com"
                className="flex-1"
                disabled
              />
              <Button disabled>Access Website</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: This service is coming soon and is intended for accessing
              legitimate educational resources only.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="border border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Academic Use Only</CardTitle>
                <CardDescription>For educational purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our unblocking service is designed specifically for accessing
                  legitimate educational resources, research materials, and
                  academic websites that may be inadvertently blocked by
                  university networks.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your browsing remains confidential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use encrypted connections to ensure your academic research
                  remains private and secure. We don't log your browsing
                  activity or share any data with third parties.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Performance</CardTitle>
                <CardDescription>
                  Optimized for research efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our proxy service is optimized for speed, allowing you to
                  access research papers, educational videos, and academic
                  resources without frustrating delays or buffering.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Global Access</CardTitle>
                <CardDescription>Research without boundaries</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access educational content from around the world, including
                  international journals, research databases, and academic
                  resources that might be geographically restricted.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-secondary/20 p-6 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              This service is provided exclusively for accessing legitimate
              educational and research materials. By using this service, you
              agree to our acceptable use policy and confirm that you will only
              use it for academic purposes.
            </p>
            <p className="text-muted-foreground mb-4">
              Prohibited uses include accessing non-educational content, illegal
              materials, or any activity that violates your university's
              policies or applicable laws.
            </p>
            <Button asChild variant="outline">
              <Link href="/terms-of-service">View Full Terms of Service</Link>
            </Button>
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
