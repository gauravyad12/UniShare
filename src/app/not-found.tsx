import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
