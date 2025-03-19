import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { GraduationCap, BookOpen, Users, Search } from "lucide-react";
import UserProfile from "./user-profile";
import { ThemeToggle } from "./theme-toggle";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <nav className="w-full border-b border-border bg-background py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">UniShare</span>
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          <Link
            href="/#platform-features"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            How It Works
          </Link>
          <Link
            href="/universities"
            className="text-foreground/80 hover:text-primary font-medium"
          >
            Universities
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium">
                <Button>Dashboard</Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
