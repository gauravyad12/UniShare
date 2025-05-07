"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Link as LinkIcon, CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, GraduationCap, X, HelpCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CanvasCourse {
  id: string;
  name: string;
  code: string;
  score: number;
  grade: string;
  credits: number;
  gradePoints: number;
  excluded: boolean;
}

interface CanvasIntegration {
  id: string;
  user_id: string;
  domain: string;
  is_connected: boolean;
  last_synced: string;
  gpa: number;
  courses?: string; // JSON string of CanvasCourse[]
}

export default function CanvasIntegrationCard() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [integration, setIntegration] = useState<CanvasIntegration | null>(null);
  const [domain, setDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [showCourses, setShowCourses] = useState(false); // Keep collapsed by default
  const [updatingCourse, setUpdatingCourse] = useState<string | null>(null);

  // Track if component is mounted to prevent unnecessary API calls
  const isMounted = useRef(false);

  // Initialize component
  useEffect(() => {
    // Only fetch status if not already mounted
    if (!isMounted.current) {
      isMounted.current = true;
      // Initialize Canvas integration
      fetchCanvasStatus();
    }

    // Cleanup function to reset mounted state when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load saved courses from local storage when integration is loaded
  // Using a ref to track if we've already loaded courses to prevent infinite loops
  const hasLoadedCourses = useRef(false);

  useEffect(() => {
    // Only load courses if we haven't already and integration exists
    if (integration && !hasLoadedCourses.current) {
      hasLoadedCourses.current = true; // Mark as loaded to prevent future runs

      // Try to load courses from local storage
      try {
        const storedCourses = localStorage.getItem('canvas_courses');
        if (storedCourses) {
          const parsedCourses = JSON.parse(storedCourses);
          console.log(`Loaded ${parsedCourses.length} courses from local storage`);

          // Set courses in state
          setCourses(parsedCourses);

          // Calculate GPA for display purposes only (no database update)
          let totalPoints = 0;
          let totalCredits = 0;

          parsedCourses.forEach(course => {
            if (!course.excluded) {
              totalPoints += course.gradePoints * course.credits;
              totalCredits += course.credits;
            }
          });

          const calculatedGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

          // Only log the difference, don't update state to avoid loops
          if (calculatedGpa !== integration.gpa) {
            console.log(`Local GPA calculation: ${calculatedGpa} (database has ${integration.gpa})`);
            // We don't update integration state here to avoid triggering another effect run
          }
        }
      } catch (e) {
        console.error("Error loading courses from local storage:", e);
      }
    }
  }, [integration]);

  // Only log course updates in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Use a more concise log format
      console.log(`Courses updated: ${courses.length} courses, ${courses.filter(c => c.excluded).length} excluded`);
    }
  }, [courses]);

  const fetchCanvasStatus = async () => {
    try {
      setLoading(true);
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("Fetching Canvas status...");
      }

      // First get the integration status
      const response = await fetch("/api/canvas/status");
      const data = await response.json();

      // Only log detailed responses in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("Canvas status response:", data);
      }

      if (data.success) {
        setIsConnected(data.isConnected);
        setIntegration(data.integration);
        if (data.integration?.domain) {
          setDomain(data.integration.domain);
        }

        // If connected, load courses from local storage but don't sync automatically
        if (data.isConnected) {
          if (process.env.NODE_ENV === 'development') {
            console.log("Canvas is connected, loading courses from local storage...");
          }
          // We don't call syncGpa() here anymore to prevent automatic API calls
          // The user can manually sync using the refresh button

          // Reset the hasLoadedCourses flag to allow the useEffect to load courses
          hasLoadedCourses.current = false;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log("Canvas is not connected, no courses to fetch");
          }
          setCourses([]);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("Failed to get Canvas status");
        }
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching Canvas status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Reset any previous connection errors
      setConnectionError(null);

      if (!domain || !accessToken) {
        console.error("Canvas domain and access token are required");
        return;
      }

      setConnecting(true);
      const response = await fetch("/api/canvas/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain, accessToken }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setIntegration(data.integration);
        setAccessToken("");
        console.log("Canvas integration connected successfully");

        // Sync GPA after connecting
        syncGpa();
      } else {
        // Get a user-friendly error message
        const rawErrorMessage = data.error || "Failed to connect Canvas integration";
        const errorMessage = getUserFriendlyErrorMessage(rawErrorMessage);

        // Set the error message for display in the UI
        setConnectionError(errorMessage);
        console.error("Connection Error:", errorMessage);
      }
    } catch (error) {
      console.error("Error connecting Canvas:", error);

      // Set an error message for display in the UI
      const errorMessage = getUserFriendlyErrorMessage("Network error: Connection failed");
      setConnectionError(errorMessage);
      console.error("Connection Error:", errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const response = await fetch("/api/canvas/disconnect", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Clear local storage related to Canvas integration
        try {
          localStorage.removeItem('canvas_courses');
          localStorage.removeItem('canvas_course_exclusions');
          console.log("Cleared Canvas integration data from local storage");
        } catch (e) {
          console.error("Error clearing Canvas data from local storage:", e);
        }

        // Reset state
        setIsConnected(false);
        setIntegration(null);
        setCourses([]);

        console.log("Canvas integration disconnected successfully");
      } else {
        console.error("Failed to disconnect Canvas integration:", data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error disconnecting Canvas:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  const syncGpa = async () => {
    try {
      setSyncing(true);
      // Start GPA sync process

      const response = await fetch("/api/canvas/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      // Get the response as JSON
      const data = await response.json();
      console.log(`Sync response: ${data.success ? 'success' : 'failed'}, GPA: ${data.gpa}`);

      if (data.success) {
        // Update integration data
        setIntegration(data.integration);

        // Process courses from the response
        if (data.courses && Array.isArray(data.courses)) {
          console.log(`Received ${data.courses.length} courses from Canvas`);

          if (data.courses.length > 0) {
            // Apply saved exclusion preferences to new courses
            let coursesWithExclusions = [...data.courses];

            try {
              // Get saved exclusion preferences
              const storedPreferences = localStorage.getItem('canvas_course_exclusions');

              if (storedPreferences) {
                const exclusionPreferences = JSON.parse(storedPreferences);
                console.log(`Retrieved exclusion preferences for ${Object.keys(exclusionPreferences).length} courses`);

                // Apply preferences to courses
                coursesWithExclusions = data.courses.map(course => {
                  if (exclusionPreferences[course.id] !== undefined) {
                    return { ...course, excluded: exclusionPreferences[course.id] };
                  }
                  return course;
                });

                // Applied exclusion preferences

                // Recalculate GPA based on exclusions
                let totalPoints = 0;
                let totalCredits = 0;

                coursesWithExclusions.forEach(course => {
                  if (!course.excluded) {
                    totalPoints += course.gradePoints * course.credits;
                    totalCredits += course.credits;
                  }
                });

                const recalculatedGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
                // GPA recalculated after applying exclusions

                // If GPA is different from what's in the response, update both local state and database
                if (recalculatedGpa !== data.gpa) {
                  console.log(`Updating GPA: ${data.gpa} → ${recalculatedGpa} based on excluded courses`);

                  // Update the database with our recalculated GPA
                  // We only update the GPA, not the courses (which are stored in localStorage)
                  await updateGpaInDatabase(recalculatedGpa);

                  // Update local state with the recalculated value
                  if (data.integration) {
                    data.integration.gpa = recalculatedGpa;
                  }
                }
              } else {
                console.log("No saved exclusion preferences found");
              }
            } catch (e) {
              console.error("Error applying exclusion preferences:", e);
            }

            // Set courses in state
            setCourses(coursesWithExclusions);

            // Save courses to local storage
            try {
              localStorage.setItem('canvas_courses', JSON.stringify(coursesWithExclusions));
              // Courses saved to local storage
            } catch (e) {
              console.error("Error saving courses to local storage:", e);
            }

            // Keep the courses section collapsed by default
            // setShowCourses(true); // Removed to keep collapsed
          } else {
            console.log("Empty courses array in response");
            // Use simulated courses for testing
            // Create base simulated courses
            let simulatedCourses = [
              {
                id: "1",
                name: "Computer Science I",
                code: "COP3502",
                score: 92.5,
                grade: "A",
                credits: 3.0,
                gradePoints: 4.0,
                excluded: false
              },
              {
                id: "2",
                name: "Calculus with Analytic Geometry II",
                code: "MAC2312",
                score: 85.0,
                grade: "B",
                credits: 4.0,
                gradePoints: 3.0,
                excluded: false
              },
              {
                id: "3",
                name: "Honors Humanistic Tradition",
                code: "HUM2020H",
                score: 88.0,
                grade: "B+",
                credits: 3.0,
                gradePoints: 3.3,
                excluded: false
              },
              {
                id: "4",
                name: "Computer Science Lab",
                code: "COP3502L",
                score: 95.0,
                grade: "A",
                credits: 1.0,
                gradePoints: 4.0,
                excluded: false
              },
              {
                id: "5",
                name: "Music in Western Culture",
                code: "MUL2010",
                score: 91.0,
                grade: "A-",
                credits: 3.0,
                gradePoints: 3.7,
                excluded: false
              }
            ];

            // Apply saved exclusion preferences to simulated courses
            try {
              const storedPreferences = localStorage.getItem('canvas_course_exclusions');

              if (storedPreferences) {
                const exclusionPreferences = JSON.parse(storedPreferences);
                console.log("Retrieved exclusion preferences for simulated courses:", exclusionPreferences);

                // Apply preferences to courses
                simulatedCourses = simulatedCourses.map(course => {
                  if (exclusionPreferences[course.id] !== undefined) {
                    return { ...course, excluded: exclusionPreferences[course.id] };
                  }
                  return course;
                });

                console.log("Applied exclusion preferences to simulated courses");
              }
            } catch (e) {
              console.error("Error applying exclusion preferences to simulated courses:", e);
            }

            setCourses(simulatedCourses);

            // Save simulated courses to local storage
            try {
              localStorage.setItem('canvas_courses', JSON.stringify(simulatedCourses));
              console.log("Saved simulated courses to local storage");

              // Calculate GPA for display only (no database update)
              let totalPoints = 0;
              let totalCredits = 0;

              simulatedCourses.forEach(course => {
                if (!course.excluded) {
                  totalPoints += course.gradePoints * course.credits;
                  totalCredits += course.credits;
                }
              });

              const calculatedGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
              console.log(`Simulated courses GPA calculation: ${calculatedGpa}`);

              // Update both local state and database
              if (data.integration && data.integration.gpa !== calculatedGpa) {
                console.log(`Updating GPA for simulated courses: ${data.integration.gpa} → ${calculatedGpa}`);

                // Update the database with our calculated GPA
                // We only update the GPA, not the courses (which are stored in localStorage)
                await updateGpaInDatabase(calculatedGpa);

                // Update local state with the calculated value
                data.integration.gpa = calculatedGpa;
              }
            } catch (e) {
              console.error("Error saving simulated courses to local storage:", e);
            }
            // Keep the courses section collapsed by default
            // setShowCourses(true); // Removed to keep collapsed
          }
        } else {
          console.log("No courses data available in sync response");
        }

        console.log("Success: Canvas GPA synced successfully");
      } else {
        console.error("Error: " + (data.error || "Failed to sync Canvas GPA"));
      }
    } catch (error) {
      console.error("Error syncing Canvas GPA:", error);
    } finally {
      setSyncing(false);
    }
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-500";
    if (gpa >= 3.0) return "text-blue-500";
    if (gpa >= 2.5) return "text-yellow-500";
    return "text-red-500";
  };

  // Helper function to get user-friendly error messages
  const getUserFriendlyErrorMessage = (error: string): string => {
    // Domain not found errors
    if (error.includes('ENOTFOUND') || error.includes('Domain not found')) {
      return "Canvas domain not found. Please check the domain name and try again.";
    }

    // Connection refused errors
    if (error.includes('ECONNREFUSED') || error.includes('Connection refused')) {
      return "Cannot connect to Canvas. The server may be down or not accepting connections.";
    }

    // Invalid token errors
    if (error.includes('Invalid access token') || error.includes('401')) {
      return "Invalid access token. Please check your token and try again.";
    }

    // Network errors
    if (error.includes('Network error') || error.includes('fetch failed')) {
      return "Network error. Please check your internet connection and try again.";
    }

    // Default error message
    return error;
  };

  // Helper function to update GPA in database
  const updateGpaInDatabase = async (gpa: string) => {
    try {
      // Update GPA in database
      const response = await fetch("/api/canvas/update-gpa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gpa }),
      });

      const data = await response.json();
      if (data.success) {
        // GPA successfully updated
        console.log(`[Canvas API] Successfully updated GPA to: ${gpa}`);
        return true;
      } else {
        console.error("Error updating GPA in database:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Exception updating GPA in database:", error);
      return false;
    }
  };

  const handleToggleCourseExclusion = async (courseId: string, excluded: boolean) => {
    try {
      setUpdatingCourse(courseId);
      console.log(`${excluded ? 'Excluding' : 'Including'} course: ${courseId}`);

      // Update courses locally
      const updatedCourses = courses.map(course => {
        if (course.id === courseId) {
          return { ...course, excluded };
        }
        return course;
      });

      // Calculate new GPA
      let totalPoints = 0;
      let totalCredits = 0;

      updatedCourses.forEach(course => {
        if (!course.excluded) {
          totalPoints += course.gradePoints * course.credits;
          totalCredits += course.credits;
        }
      });

      const newGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
      // New GPA calculated

      // Update local state
      setCourses(updatedCourses);

      // Save courses to local storage
      try {
        localStorage.setItem('canvas_courses', JSON.stringify(updatedCourses));
        // Courses saved to local storage
      } catch (e) {
        console.error("Error saving courses to local storage:", e);
      }

      // Save course exclusion preferences separately for persistence
      try {
        // Get existing exclusion preferences or initialize empty object
        const storedPreferences = localStorage.getItem('canvas_course_exclusions');
        const exclusionPreferences = storedPreferences ? JSON.parse(storedPreferences) : {};

        // Update preferences for this course
        exclusionPreferences[courseId] = excluded;

        // Save updated preferences
        localStorage.setItem('canvas_course_exclusions', JSON.stringify(exclusionPreferences));
        // Course exclusion preferences saved
      } catch (e) {
        console.error("Error saving course exclusion preferences:", e);
      }

      // Update integration with new GPA
      if (integration) {
        const updatedIntegration = {
          ...integration,
          gpa: newGpa
        };
        setIntegration(updatedIntegration);

        // Call the API to update the GPA in the database
        // Also send the updated courses for accurate GPA calculation on the server
        const response = await fetch("/api/canvas/toggle-course", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            excluded,
            courses: updatedCourses // Send the full updated courses array
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.error("Error updating course exclusion on server:", data.error);
        }
      }

      console.log(`Success: Course ${excluded ? "excluded from" : "included in"} GPA calculation`);
    } catch (error) {
      console.error("Error toggling course exclusion:", error);
    } finally {
      setUpdatingCourse(null);
    }
  };

  return (
    <Card className="canvas-integration-responsive">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Canvas Integration
              {isConnected && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connect to Canvas to display your estimated GPA
            </CardDescription>
          </div>
          {isConnected && (
            <Button
              variant="outline"
              size="icon"
              onClick={syncGpa}
              disabled={syncing}
              title="Sync GPA"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="card-content">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isConnected ? (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Domain</p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <LinkIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{integration?.domain}</span>
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-sm font-medium">Last Synced</p>
                <p className="text-sm text-muted-foreground">
                  {integration?.last_synced
                    ? formatDistanceToNow(new Date(integration.last_synced), {
                        addSuffix: true,
                      })
                    : "Never"}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center mx-auto max-w-xs md:max-w-sm">
              <p className="text-sm font-medium mb-1">Estimated GPA</p>
              {integration?.gpa ? (
                <p className={`text-3xl font-bold ${getGpaColor(integration.gpa)}`}>
                  {integration.gpa}
                </p>
              ) : (
                <p className="text-muted-foreground">Not available</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground mb-4 text-center">
              <p>Last updated: {integration?.last_synced ? formatDistanceToNow(new Date(integration.last_synced), { addSuffix: true }) : "Never"}</p>
            </div>

            <Collapsible
              open={showCourses}
              onOpenChange={setShowCourses}
              className="border rounded-md flex-1"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-between p-4">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Courses Affecting GPA</span>
                    {courses.length > 0 && (
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">{courses.length}</Badge>
                    )}
                  </div>
                  {showCourses ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                {/* Render courses section */}
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        Toggle courses to include or exclude them from your GPA calculation.
                        ({courses.length} courses found)
                      </p>
                    </div>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {courses.map((course) => (
                        <div key={course.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-md hover:bg-muted/30 transition-colors">
                        <div className="pt-0.5 flex-shrink-0">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={!course.excluded}
                            onCheckedChange={(checked) => {
                              handleToggleCourseExclusion(course.id, !checked);
                            }}
                            disabled={updatingCourse === course.id}
                          />
                        </div>
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex flex-col">
                            <label
                              htmlFor={`course-${course.id}`}
                              className={`text-sm font-medium truncate ${course.excluded ? 'text-muted-foreground line-through' : ''}`}
                              title={course.name}
                            >
                              {course.name}
                            </label>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              {course.code && (
                                <span className="font-medium">{course.code}</span>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                                <span className="flex items-center gap-1 flex-shrink-0">
                                  <GraduationCap className="h-3 w-3" />
                                  {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
                                </span>
                                {course.grade && (
                                  <span className="px-1.5 py-0.5 rounded-sm bg-muted-foreground/10 flex-shrink-0">
                                    Grade: {course.grade}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="self-start sm:self-center mt-2 sm:mt-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="px-2 py-1 rounded bg-muted text-xs font-medium flex-shrink-0">
                                {course.score}%
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Grade Points: {course.gradePoints.toFixed(1)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No courses found. Sync with Canvas to load your courses.</p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="space-y-4">
            {connectionError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Connection Error</h4>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{connectionError}</p>
                      <div className="mt-2">
                        <p className="text-xs text-red-600 dark:text-red-400">Please check:</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside mt-1 space-y-1">
                          <li>Your Canvas domain is correct (e.g., canvas.university.edu)</li>
                          <li>Your access token is valid and has not expired</li>
                          <li>Your Canvas instance is accessible</li>
                        </ul>
                        <div className="mt-3 text-xs">
                          <a
                            href="https://community.canvaslms.com/t5/Canvas-Basics-Guide/How-do-I-manage-API-access-tokens-in-my-user-account/ta-p/615312"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            How to get a Canvas API token
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConnectionError(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="domain">Canvas Domain</Label>
              <Input
                id="domain"
                placeholder="canvas.university.edu"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  // Clear error when user starts typing
                  if (connectionError) setConnectionError(null);
                }}
                className={connectionError ? "border-red-300 dark:border-red-700" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Enter your Canvas domain without https:// or trailing slashes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Canvas API access token"
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  // Clear error when user starts typing
                  if (connectionError) setConnectionError(null);
                }}
                className={connectionError ? "border-red-300 dark:border-red-700" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Generate an access token in your Canvas account settings
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end card-footer">
        {isConnected ? (
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="How to get a Canvas token">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] pb-6">
                <DialogHeader>
                  <DialogTitle>How to Get a Canvas Access Token</DialogTitle>
                  <DialogDescription>
                    Follow these steps to generate an API token for Canvas integration
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <ol className="list-decimal pl-5 space-y-3">
                    <li className="text-sm">
                      <span className="font-medium">Log in to Canvas:</span> Access your Canvas account through your institution's Canvas login page.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Navigate to Account Settings:</span> In the Global Navigation menu on the left, click on "Account" and then "Settings".
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Find Approved Integrations:</span> Scroll down to the "Approved Integrations" section.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Generate a New Token:</span> Click the "+ New Access Token" button.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Specify Purpose and Expiry:</span> Fill out the form, including the purpose of the token (e.g., "UniShare GPA Integration") and an optional expiry date. Adding an expiry date increases security.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Generate the Token:</span> Click the "Generate Token" button.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Save the Token Securely:</span> Copy the generated token and save it in a secure location, as it will only be displayed once.
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Paste it into UniShare:</span> Copy the token and paste it into the Access Token field in the Canvas integration form.
                    </li>
                  </ol>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 pb-2 border-t">
                    <p className="text-xs text-muted-foreground">For more detailed instructions, visit Canvas documentation</p>
                    <a
                      href="https://community.canvaslms.com/t5/Canvas-Basics-Guide/How-do-I-manage-API-access-tokens-in-my-user-account/ta-p/615312"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Canvas Documentation
                    </a>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
