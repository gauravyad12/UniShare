import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

interface University {
  name: string;
  domain: string;
  logo_url: string;
  description: string;
  established: string;
  students: string;
}

export default async function Universities() {
  const supabase = createClient();
  const { data: universities, error } = await supabase
    .from("universities")
    .select("*");

  if (error) {
    console.error("Error fetching universities:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Supported Universities</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            UniShare is currently available at these universities. We're
            expanding to more campuses soon!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {universities &&
            universities.map((university, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-6 p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-all border"
              >
                <div className="flex-shrink-0 w-24 h-24 mx-auto md:mx-0">
                  <img
                    src={university.logo_url}
                    alt={`${university.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold mb-2">
                    {university.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {university.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Domain:</span>{" "}
                      {university.domain}
                    </div>
                    <div>
                      <span className="font-medium">Established:</span>{" "}
                      {university.established}
                    </div>
                    <div>
                      <span className="font-medium">Students:</span>{" "}
                      {university.students}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Don't see your university?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            We're constantly expanding to more universities. If you'd like to
            bring UniShare to your campus, let us know and we'll work with your
            university administration to make it happen.
          </p>
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request Your University
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
