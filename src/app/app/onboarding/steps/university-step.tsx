"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Search, X } from "lucide-react";
import UniversitySearch from "@/components/university-search";

// Function to get university abbreviation
const getUniversityAbbreviation = (name: string): string => {
  // Common university abbreviations
  const commonAbbreviations: Record<string, string> = {
    "University of Central Florida": "UCF",
    "Florida State University": "FSU",
    "University of Florida": "UF",
    "Massachusetts Institute of Technology": "MIT",
    "California Institute of Technology": "Caltech",
    "University of California, Los Angeles": "UCLA",
    "University of California, Berkeley": "UC Berkeley",
    "University of Southern California": "USC",
    "New York University": "NYU",
    "Georgia Institute of Technology": "Georgia Tech",
    "Pennsylvania State University": "Penn State",
    "University of Michigan": "U-M",
    "University of Texas at Austin": "UT Austin",
    "University of Wisconsin-Madison": "UW-Madison",
    "University of Illinois Urbana-Champaign": "UIUC",
    "University of North Carolina at Chapel Hill": "UNC",
    "University of California, San Diego": "UCSD",
    "University of Washington": "UW",
    "Standard User (Not a Student)": "Not a Student",
    "Standard User": "Not a Student",
    "Not a Student": "Not a Student"
  };

  // Check if we have a predefined abbreviation
  if (commonAbbreviations[name]) {
    return commonAbbreviations[name];
  }

  // Try to create an abbreviation from the name
  if (name.includes("University")) {
    // For names like "X University", just return X
    const parts = name.split("University");
    if (parts[0].trim()) {
      return parts[0].trim();
    }
  }

  // For "University of X", return X
  if (name.includes("University of")) {
    const parts = name.replace("University of", "").trim().split(" ");
    if (parts.length > 0) {
      return parts[0];
    }
  }

  // If all else fails, return the last word
  const words = name.split(" ");
  return words[words.length - 1];
};

export default function UniversityStep({
  selectedUniversity,
  setSelectedUniversity,
  isStudent,
  setIsStudent
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [universities, setUniversities] = useState([]);
  const [popularUniversities, setPopularUniversities] = useState([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [universityError, setUniversityError] = useState("");
  const [universityStats, setUniversityStats] = useState({});
  const [totalUniversities, setTotalUniversities] = useState(0);

  // Fetch all universities and stats on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingUniversities(true);

        // Fetch universities
        const universitiesResponse = await fetch('/api/universities');

        if (!universitiesResponse.ok) {
          throw new Error('Failed to fetch universities');
        }

        const universitiesData = await universitiesResponse.json();

        // Fetch university stats (user counts)
        const statsResponse = await fetch('/api/university-stats');

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch university statistics');
        }

        const statsData = await statsResponse.json();

        // Make a direct API call to get the Standard User university
        const standardUserResponse = await fetch('/api/standard-user');

        if (!standardUserResponse.ok) {
          console.warn('Failed to fetch Standard User university');
          // Continue without Standard User
          var standardUser = null;
        } else {
          const standardUserData = await standardUserResponse.json();
          // Get the Standard User from the direct API call
          var standardUser = standardUserData.university;
        }

        // Check if Standard User university exists in the database
        const standardUserExists = !!standardUser;

        // Create a "Not a Student" card based on the Standard User
        const notAStudentCard = standardUserExists
          ? { ...standardUser, name: "Not a Student" }
          : { id: "standard", name: "Not a Student", students: "0", logo_url: "https://cdn-icons-png.freepik.com/512/4159/4159471.png" };

        // Filter out Standard User from the universities list for search/dropdown
        const filteredUniversities = universitiesData.universities.filter(uni =>
          uni.name !== "Standard User"
        );

        // Add the "Not a Student" option back for internal use
        const allUniversities = [
          ...filteredUniversities,
          standardUserExists ? standardUser : notAStudentCard
        ];

        setUniversities(allUniversities);
        setTotalUniversities(filteredUniversities.length);

        // Set university stats
        setUniversityStats(statsData.stats || {});

        // Set popular universities (first 5 with logos for display)
        const popular = filteredUniversities
          .filter(uni => uni.logo_url)
          .slice(0, 5);

        // Add "Not a Student" card to popular universities only if Standard User exists
        if (standardUserExists) {
          setPopularUniversities([...popular, notAStudentCard]);
        } else {
          // If Standard User doesn't exist, find another university to fill the spot
          const extraUniversity = filteredUniversities
            .filter(uni => uni.logo_url && !popular.some(p => p.id === uni.id))
            .slice(0, 1)[0];

          if (extraUniversity) {
            // If we found another university, add it to fill the spot
            setPopularUniversities([...popular, extraUniversity]);
          } else {
            // If no extra university is available, just show what we have
            setPopularUniversities(popular);
          }
        }

        setUniversityError("");
      } catch (error) {
        console.error('Error fetching data:', error);
        setUniversityError("Failed to load universities. Please try again.");
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle non-student selection
  useEffect(() => {
    if (!isStudent && universities.length > 0) {
      // Find the Standard User university
      const standardUser = universities.find(uni => uni.name === "Standard User");
      if (standardUser) {
        setSelectedUniversity(standardUser.id);
      } else {
        // Fallback to "standard" if not found
        setSelectedUniversity("standard");
      }
    }
  }, [isStudent, universities, setSelectedUniversity]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
        <GraduationCap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Select Your University</h2>
      <p className="text-muted-foreground mb-4 max-w-xs">
        Join your university's community on UniShare and connect with fellow students.
      </p>

      <div className="w-full max-w-xs mb-4">
        {/* Use the standalone component */}
        <UniversitySearch
          onSelect={(id, name) => {
            setSelectedUniversity(id);
            setSearchQuery(name);

            // Update isStudent based on selection
            if (name === "Not a Student") {
              setIsStudent(false);
            } else {
              setIsStudent(true);
            }
          }}
        />

        {/* University cards */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-medium text-muted-foreground">Supported Universities</h3>
            <Badge variant="outline" className="text-xs">
              {totalUniversities || popularUniversities.length}+ total
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {popularUniversities.length > 0 ? (
              popularUniversities.map((university) => (
                <motion.div
                  key={university.id}
                  className={`bg-background rounded-lg border ${selectedUniversity === university.id ? 'border-primary' : 'border-border'} p-2 flex flex-col items-center justify-center cursor-pointer`}
                  whileHover={{ y: -1, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => {
                    // Set the university selection
                    setSelectedUniversity(university.id);
                    setSearchQuery(university.name);

                    // Update isStudent based on selection
                    if (university.name === "Not a Student") {
                      setIsStudent(false);
                    } else {
                      // If selecting a regular university, set isStudent to true
                      setIsStudent(true);
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted mb-1 flex items-center justify-center">
                    {university.logo_url ? (
                      <Image
                        src={university.logo_url}
                        alt={university.name}
                        width={32}
                        height={32}
                        className="object-contain w-auto h-auto max-w-full max-h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-center line-clamp-1 font-medium">
                    {getUniversityAbbreviation(university.name)}
                  </span>
                  <span className="text-[8px] text-muted-foreground">
                    {universityStats && universityStats[university.id] ? `${universityStats[university.id]} users` : 'New'}
                  </span>
                </motion.div>
              ))
            ) : (
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="bg-muted/50 rounded-lg border border-border p-2 h-16"></div>
              ))
            )}
          </div>

          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {(totalUniversities || 0) > popularUniversities.length &&
                `+${(totalUniversities || 0) - popularUniversities.length} more universities supported`}
            </span>
          </div>
        </div>
      </div>

      {/* Selected University Info */}
      {selectedUniversity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs"
        >
          <div className="bg-background rounded-lg p-4 border border-border mb-4">
            <div className="flex items-center gap-3">
              {/* University Logo */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border flex items-center justify-center">
                {universities.find(u => u.id === selectedUniversity)?.logo_url ? (
                  <Image
                    src={universities.find(u => u.id === selectedUniversity)?.logo_url}
                    alt={universities.find(u => u.id === selectedUniversity)?.name || "University"}
                    width={48}
                    height={48}
                    className="object-contain w-auto h-auto max-w-full max-h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              {/* University Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate max-w-[150px]" title={
                    !isStudent || universities.find(u => u.id === selectedUniversity)?.name === "Standard User"
                      ? "Not a Student"
                      : universities.find(u => u.id === selectedUniversity)?.name
                  }>
                    {!isStudent || universities.find(u => u.id === selectedUniversity)?.name === "Standard User"
                      ? "Not a Student"
                      : universities.find(u => u.id === selectedUniversity)?.name}
                  </span>
                  <Badge variant="outline" className="bg-primary/5 text-primary ml-2 flex-shrink-0">
                    {universityStats && universityStats[selectedUniversity] ? `${universityStats[selectedUniversity]} users` : 'New'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  {universityStats && universityStats[selectedUniversity] && universityStats[selectedUniversity] > 10
                    ? "Join a thriving community of students sharing resources and knowledge!"
                    : "Be among the first to build your university's community on UniShare!"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
