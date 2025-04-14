import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "UniShare | Supported Universities",
  description: "View the list of universities currently supported by UniShare",
};

interface University {
  id: number;
  name: string;
  domain: string;
  logo_url?: string;
  description?: string;
  established?: string;
  students?: string;
}

export default async function Universities() {
  let universities: University[] = [];
  let fetchError = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("universities").select("*");

    if (error) {
      console.error("Error fetching universities:", error);
      fetchError = error;
    } else {
      universities = data || [];
      console.log("Universities loaded:", universities.length);
    }
  } catch (error) {
    console.error("Exception fetching universities:", error);
    fetchError = error;
  }

  // No sample universities, only show actual data
  const displayUniversities = universities;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Supported Universities</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            UniShare is currently available at these universities. We're
            expanding to more campuses soon!
          </p>
          {fetchError && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-md max-w-2xl mx-auto">
              <p>
                We're experiencing some technical difficulties loading the
                university list.
              </p>
              <p className="text-sm">
                Please try again later or contact support if the issue persists.
              </p>
            </div>
          )}
        </div>

        {!fetchError && displayUniversities.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {displayUniversities.map((university, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-all border"
              >
                <div className="flex-shrink-0 w-24 h-24 mx-auto">
                  <img
                    src={
                      university.logo_url ||
                      "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&q=80"
                    }
                    alt={`${university.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-grow text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {university.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {university.description || "Join our university community!"}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Domain:</span>{" "}
                      {university.domain}
                    </div>
                    {university.established && (
                      <div>
                        <span className="font-medium">Established:</span>{" "}
                        {university.established}
                      </div>
                    )}
                    {university.students && (
                      <div>
                        <span className="font-medium">Students:</span>{" "}
                        {university.students}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!fetchError && displayUniversities.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              No universities available at the moment. We're working on
              expanding our network.
            </p>
          </div>
        )}

        {fetchError && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Unable to load universities. Please try again later or contact
              support.
            </p>
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Don't see your university?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            We're constantly expanding to more universities. If you'd like to
            bring UniShare to your campus, let us know and we'll work with your
            university administration to make it happen.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request Your University
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
