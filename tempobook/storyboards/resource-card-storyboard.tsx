import ResourceCard from "@/components/resource-card";

export default function ResourceCardStoryboard() {
  const sampleResource = {
    id: "1",
    title: "Calculus I - Complete Lecture Notes",
    description:
      "Comprehensive lecture notes covering limits, derivatives, and integrals with example problems and solutions.",
    resource_type: "Notes",
    course_code: "MATH 101",
    professor: "Dr. Smith",
    view_count: 245,
    download_count: 128,
    created_at: "2023-09-15T14:30:00Z",
    tags: [
      { tag_name: "calculus" },
      { tag_name: "derivatives" },
      { tag_name: "integrals" },
    ],
    ratings: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
  };

  return (
    <div className="p-6 max-w-md bg-white">
      <ResourceCard
        resource={sampleResource}
        onView={(id) => console.log(`View resource ${id}`)}
        onDownload={(id) => console.log(`Download resource ${id}`)}
      />
    </div>
  );
}
