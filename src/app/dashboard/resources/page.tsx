import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import ResourceCard from "@/components/resource-card";

export default async function ResourcesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user's university
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("university_id")
    .eq("id", user.id)
    .single();

  // Get resources for user's university
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("university_id", userProfile?.university_id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Resources</h1>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resource
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search resources by title, course code, or professor..."
                className="pl-10"
              />
            </div>
          </header>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Resources</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="textbooks">Textbooks</TabsTrigger>
              <TabsTrigger value="links">External Links</TabsTrigger>
              <TabsTrigger value="my-uploads">My Uploads</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {resources && resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/40">
                  <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                    <CardTitle>No resources found</CardTitle>
                    <CardDescription>
                      Be the first to upload resources for your university!
                    </CardDescription>
                    <Button className="mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Resource
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <CardTitle>Notes Section</CardTitle>
                  <CardDescription>
                    Find and share lecture notes, study guides, and more.
                  </CardDescription>
                  <Button className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Notes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="textbooks" className="space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                  <CardTitle>Textbooks Section</CardTitle>
                  <CardDescription>
                    Find and share textbook solutions, summaries, and guides.
                  </CardDescription>
                  <Button className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Textbook Resource
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <LinkIcon className="h-12 w-12 text-muted-foreground" />
                  <CardTitle>External Links Section</CardTitle>
                  <CardDescription>
                    Share helpful websites, videos, and online resources.
                  </CardDescription>
                  <Button className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Add External Link
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-uploads" className="space-y-4">
              <Card className="bg-muted/40">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <CardTitle>My Uploads</CardTitle>
                  <CardDescription>
                    View and manage resources you've shared with your
                    university.
                  </CardDescription>
                  <Button className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload New Resource
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
