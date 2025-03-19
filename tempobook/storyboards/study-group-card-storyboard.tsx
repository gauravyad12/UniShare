import StudyGroupCard from "@/components/study-group-card";

export default function StudyGroupCardStoryboard() {
  const sampleGroup = {
    id: "1",
    name: "Advanced Physics Study Group",
    description:
      "Weekly study sessions focusing on quantum mechanics and relativity. Open to all physics majors.",
    course_code: "PHYS 301",
    is_private: false,
    max_members: 15,
    created_at: "2023-10-05T10:00:00Z",
    _count: {
      members: 8,
      meetings: 2,
    },
  };

  return (
    <div className="p-6 max-w-md bg-white">
      <StudyGroupCard
        group={sampleGroup}
        onView={(id) => console.log(`View group ${id}`)}
        onJoin={(id) => console.log(`Join group ${id}`)}
      />
    </div>
  );
}
