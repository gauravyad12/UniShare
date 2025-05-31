"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Settings,
  Trash2,
  Edit,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Users,
  Star,
  BarChart3,
  TrendingUp,
  Award,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Eye,
  EyeOff,
  Copy,
  Share,
  AlertTriangle,
  Brain,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DynamicPageTitle from "@/components/dynamic-page-title";
import { ClientSubscriptionCheck } from "@/components/client-subscription-check";
import CreateRoadmapDialog from "@/components/create-roadmap-dialog";
import ProfessorSearch from "@/components/professor-search";
import UniversitySearch from "@/components/university-search";
import RoadmapThumbnail from "@/components/roadmap-thumbnail";
import FlowchartUpload from "@/components/flowchart-upload";
import FlowchartAnalysisReview from "@/components/flowchart-analysis-review";
import PreviousAnalyses from "@/components/previous-analyses";
import MobileTabs from "@/components/mobile-tabs";
import ShareRoadmapButton from "@/components/share-roadmap-button";
import { createClient } from "@/utils/supabase/client";
import { type Professor } from "@/utils/rateMyProfessor";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { isAppilixOrDevelopment } from "@/utils/appilix-detection";

// Types
interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  year: number;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  grade?: string;
  prerequisites?: string[];
  description?: string;
  difficulty?: number;
  professor?: string;
  professor_data?: Professor | null;
  rating?: number;
}

interface Semester {
  id: string;
  name: string;
  year: number;
  season: 'Fall' | 'Spring' | 'Summer';
  courses: Course[];
  totalCredits: number;
}

interface DegreeRoadmap {
  id: string;
  name: string;
  major: string;
  university: string;
  totalCredits: number;
  completedCredits: number;
  expectedGraduation: string;
  gpa: number;
  semesters: Semester[];
  isPublic: boolean;
  showGpa: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Sample data for demonstration
const sampleRoadmap: DegreeRoadmap = {
  id: "1",
  name: "Computer Science Degree Plan",
  major: "Computer Science",
  university: "University of Central Florida",
  totalCredits: 120,
  completedCredits: 45,
  expectedGraduation: "Spring 2026",
  gpa: 3.7,
  isPublic: false,
  showGpa: true,
  createdBy: "user123",
  createdAt: "2024-01-15",
  updatedAt: "2024-01-20",
  semesters: [
    {
      id: "fall2024",
      name: "Fall 2024",
      year: 2024,
      season: "Fall",
      totalCredits: 15,
      courses: [
        {
          id: "cs1",
          code: "COP3502",
          name: "Computer Science I",
          credits: 3,
          semester: "Fall 2024",
          year: 2024,
          status: "completed",
          grade: "A",
          difficulty: 3,
          professor: "Dr. Smith",
          rating: 4.5
        },
        {
          id: "math1",
          code: "MAC2312",
          name: "Calculus II",
          credits: 4,
          semester: "Fall 2024",
          year: 2024,
          status: "completed",
          grade: "B+",
          difficulty: 4,
          professor: "Dr. Johnson",
          rating: 4.0
        },
        {
          id: "eng1",
          code: "ENC1101",
          name: "English Composition I",
          credits: 3,
          semester: "Fall 2024",
          year: 2024,
          status: "completed",
          grade: "A-",
          difficulty: 2,
          professor: "Prof. Williams",
          rating: 4.2
        },
        {
          id: "hist1",
          code: "AMH2010",
          name: "American History",
          credits: 3,
          semester: "Fall 2024",
          year: 2024,
          status: "completed",
          grade: "B",
          difficulty: 2,
          professor: "Dr. Brown",
          rating: 3.8
        },
        {
          id: "pe1",
          code: "PEL1121",
          name: "Fitness & Wellness",
          credits: 2,
          semester: "Fall 2024",
          year: 2024,
          status: "completed",
          grade: "A",
          difficulty: 1,
          professor: "Coach Davis",
          rating: 4.8
        }
      ]
    },
    {
      id: "spring2025",
      name: "Spring 2025",
      year: 2025,
      season: "Spring",
      totalCredits: 16,
      courses: [
        {
          id: "cs2",
          code: "COP3503",
          name: "Computer Science II",
          credits: 3,
          semester: "Spring 2025",
          year: 2025,
          status: "in-progress",
          prerequisites: ["COP3502"],
          difficulty: 4,
          professor: "Dr. Smith",
          rating: 4.3
        },
        {
          id: "math2",
          code: "MAC2313",
          name: "Calculus III",
          credits: 4,
          semester: "Spring 2025",
          year: 2025,
          status: "in-progress",
          prerequisites: ["MAC2312"],
          difficulty: 4,
          professor: "Dr. Wilson",
          rating: 3.9
        },
        {
          id: "phys1",
          code: "PHY2048",
          name: "Physics I",
          credits: 3,
          semester: "Spring 2025",
          year: 2025,
          status: "in-progress",
          difficulty: 4,
          professor: "Dr. Garcia",
          rating: 4.1
        },
        {
          id: "eng2",
          code: "ENC1102",
          name: "English Composition II",
          credits: 3,
          semester: "Spring 2025",
          year: 2025,
          status: "in-progress",
          prerequisites: ["ENC1101"],
          difficulty: 2,
          professor: "Prof. Taylor",
          rating: 4.0
        },
        {
          id: "elec1",
          code: "PSY2012",
          name: "General Psychology",
          credits: 3,
          semester: "Spring 2025",
          year: 2025,
          status: "in-progress",
          difficulty: 2,
          professor: "Dr. Anderson",
          rating: 4.4
        }
      ]
    },
    {
      id: "fall2025",
      name: "Fall 2025",
      year: 2025,
      season: "Fall",
      totalCredits: 15,
      courses: [
        {
          id: "cs3",
          code: "COP3530",
          name: "Data Structures",
          credits: 3,
          semester: "Fall 2025",
          year: 2025,
          status: "planned",
          prerequisites: ["COP3503"],
          difficulty: 4,
          description: "Introduction to data structures and algorithms"
        },
        {
          id: "math3",
          code: "STA2023",
          name: "Statistics",
          credits: 3,
          semester: "Fall 2025",
          year: 2025,
          status: "planned",
          difficulty: 3,
          description: "Statistical methods and analysis"
        },
        {
          id: "cs4",
          code: "COT3100",
          name: "Discrete Mathematics",
          credits: 3,
          semester: "Fall 2025",
          year: 2025,
          status: "planned",
          difficulty: 4,
          description: "Mathematical foundations for computer science"
        },
        {
          id: "elec2",
          code: "PHI2010",
          name: "Introduction to Philosophy",
          credits: 3,
          semester: "Fall 2025",
          year: 2025,
          status: "planned",
          difficulty: 2,
          description: "Fundamental philosophical concepts and reasoning"
        },
        {
          id: "elec3",
          code: "ART2000",
          name: "Art Appreciation",
          credits: 3,
          semester: "Fall 2025",
          year: 2025,
          status: "planned",
          difficulty: 1,
          description: "Introduction to visual arts and art history"
        }
      ]
    }
  ]
};

// Course status colors
const getStatusColor = (status: Course['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'planned':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// Course status icons
const getStatusIcon = (status: Course['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'planned':
      return <XCircle className="h-4 w-4" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <XCircle className="h-4 w-4" />;
  }
};

// Difficulty stars component
const DifficultyStars = ({ difficulty }: { difficulty?: number }) => {
  if (!difficulty) return null;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            star <= difficulty
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

// Course card component
const CourseCard = ({ course, onEdit, onDelete }: { 
  course: Course; 
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
}) => {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                {course.code}
              </Badge>
              <Badge className={`text-xs ${getStatusColor(course.status)}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(course.status)}
                  {course.status}
                </div>
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium leading-tight">
              {course.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onEdit(course)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              onClick={() => onDelete(course.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{course.credits} credits</span>
            {course.grade && (
              <span className="font-medium">Grade: {course.grade}</span>
            )}
          </div>
          
          {(course.professor || course.professor_data) && (
            <div className="text-xs text-muted-foreground">
              {course.professor_data ? (
                <div className="flex items-center gap-1">
                  <span>Prof: {course.professor_data.firstName} {course.professor_data.lastName}</span>
                  {course.professor_data.rating && (
                    <div className="flex items-center gap-1 ml-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{course.professor_data.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span>Prof: {course.professor}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {course.difficulty && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Difficulty:</span>
                <DifficultyStars difficulty={course.difficulty} />
              </div>
            )}
            {course.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {course.rating}
              </div>
            )}
          </div>
          
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Prerequisites:</span> {course.prerequisites.join(', ')}
            </div>
          )}
          
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Semester component
const SemesterSection = ({ 
  semester, 
  onEditCourse, 
  onDeleteCourse, 
  onAddCourse,
  onDeleteSemester,
  searchQuery = "",
  filterStatus = "all"
}: { 
  semester: Semester;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddCourse: (semesterId: string) => void;
  onDeleteSemester: (semesterId: string) => void;
  searchQuery?: string;
  filterStatus?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filter courses based on search query and status filter
  const filteredCourses = semester.courses.filter(course => {
    const matchesSearch = searchQuery === "" || 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.professor && course.professor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.professor_data && 
        (`${course.professor_data.firstName} ${course.professor_data.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === "all" || course.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate stats based on all courses (not filtered) for semester header
  const completedCourses = semester.courses.filter(c => c.status === 'completed').length;
  const totalCourses = semester.courses.length;
  const completionPercentage = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
  const semesterGPA = calculateSemesterGPA(semester);
  
  // Don't render the semester if no courses match the filter
  if (filteredCourses.length === 0 && (searchQuery !== "" || filterStatus !== "all")) {
    return null;
  }
  
  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="relative">
          <CollapsibleTrigger asChild>
            <CardHeader className={`cursor-pointer hover:bg-muted/50 transition-colors group pr-12 ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <CardTitle className="text-lg">{semester.name}</CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {semester.totalCredits} credits
                    </Badge>
                    {semesterGPA > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {semesterGPA.toFixed(2)} GPA
                      </Badge>
                    )}
                    {(searchQuery !== "" || filterStatus !== "all") && filteredCourses.length !== totalCourses && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {filteredCourses.length}/{totalCourses} shown
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:pr-0 pr-8">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {completedCourses}/{totalCourses} courses
                  </div>
                  <div className="w-20 lg:w-16">
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 lg:top-1/2 lg:-translate-y-1/2 lg:right-2 h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-500/10 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSemester(semester.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <CollapsibleContent>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={onEditCourse}
                  onDelete={onDeleteCourse}
                />
              ))}
              
              {/* Show message if courses are filtered out */}
              {filteredCourses.length === 0 && (searchQuery !== "" || filterStatus !== "all") && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No courses match your search criteria in this semester</p>
                </div>
              )}
              
              {/* Add course button - only show if no active filters or if there are filtered courses */}
              {(searchQuery === "" && filterStatus === "all") || filteredCourses.length > 0 ? (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent 
                    className="flex items-center justify-center h-full min-h-[120px] p-4"
                    onClick={() => onAddCourse(semester.id)}
                  >
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                        Add Course
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Add Semester Form Component
const AddSemesterForm = ({ 
  onSave, 
  onCancel 
}: { 
  onSave: (data: { name: string; year: number; season: string }) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    season: 'Fall',
    year: new Date().getFullYear()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${formData.season} ${formData.year}`;
    onSave({
      name,
      year: formData.year,
      season: formData.season
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season">Season</Label>
          <Select 
            value={formData.season} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, season: value }))}
          >
            <SelectTrigger className="h-9 py-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Spring">Spring</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
              <SelectItem value="Fall">Fall</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
            min={new Date().getFullYear() - 5}
            max={new Date().getFullYear() + 10}
            autoFocus={false}
            className="h-11 sm:h-9"
          />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 pb-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Semester
        </Button>
      </div>
    </form>
  );
};

// GPA calculation function
const calculateGPA = (roadmap: DegreeRoadmap | null): number => {
  if (!roadmap) return 0.0;

  // Get all completed and failed courses with grades
  const coursesWithGrades = roadmap.semesters
    .flatMap(semester => semester.courses)
    .filter(course => 
      (course.status === 'completed' || course.status === 'failed') && 
      course.grade && 
      course.grade.trim() !== ''
    );

  if (coursesWithGrades.length === 0) return 0.0;

  // Grade point mapping
  const gradePoints: { [key: string]: number | null } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
    // Special grades that don't count toward GPA
    'W': null, 'I': null, 'P': null, 'NP': null
  };

  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const course of coursesWithGrades) {
    const grade = course.grade!.trim();
    const gradePoint = gradePoints[grade];
    
    // Skip courses with grades that don't count toward GPA
    if (gradePoint === null || gradePoint === undefined) {
      continue;
    }

    totalGradePoints += gradePoint * course.credits;
    totalCredits += course.credits;
  }

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
};

// Calculate GPA for a specific semester
const calculateSemesterGPA = (semester: Semester): number => {
  // Get all completed and failed courses with grades in this semester
  const coursesWithGrades = semester.courses.filter(course => 
    (course.status === 'completed' || course.status === 'failed') && 
    course.grade && 
    course.grade.trim() !== ''
  );

  if (coursesWithGrades.length === 0) return 0.0;

  // Grade point mapping
  const gradePoints: { [key: string]: number | null } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0,
    // Special grades that don't count toward GPA
    'W': null, 'I': null, 'P': null, 'NP': null
  };

  let totalGradePoints = 0;
  let totalCredits = 0;

  for (const course of coursesWithGrades) {
    const grade = course.grade!.trim();
    const gradePoint = gradePoints[grade];
    
    // Skip courses with grades that don't count toward GPA
    if (gradePoint === null || gradePoint === undefined) {
      continue;
    }

    totalGradePoints += gradePoint * course.credits;
    totalCredits += course.credits;
  }

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
};

// Main component
export default function DegreeRoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<DegreeRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<DegreeRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [canvasGpa, setCanvasGpa] = useState<string | null>(null);
  const [canvasChecked, setCanvasChecked] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("roadmap");
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [isAddingSemester, setIsAddingSemester] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [filterSemester, setFilterSemester] = useState<string>("all");
  const [settingsFormData, setSettingsFormData] = useState({
    name: "",
    major: "",
    expectedGraduation: "",
    totalCredits: 120,
    isPublic: false,
    showGpa: true
  });
  const [settingsErrors, setSettingsErrors] = useState<{ [key: string]: string }>({});
  const [courseFormData, setCourseFormData] = useState({
    code: "",
    name: "",
    credits: 3,
    description: "",
    status: "planned" as Course['status'],
    grade: "",
    difficulty: 1,
    professor: ""
  });
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [courseFormErrors, setCourseFormErrors] = useState<{ [key: string]: string }>({});
  
  // Delete roadmap state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingRoadmap, setIsDeletingRoadmap] = useState(false);
  
  // Import courses state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Public roadmaps and gallery state
  const [publicRoadmaps, setPublicRoadmaps] = useState<DegreeRoadmap[]>([]);
  const [loadingPublicRoadmaps, setLoadingPublicRoadmaps] = useState(false);
  const [gallerySearchQuery, setGallerySearchQuery] = useState("");
  const [galleryFilterUniversity, setGalleryFilterUniversity] = useState("");
  const [galleryFilterUniversityName, setGalleryFilterUniversityName] = useState("");
  const [galleryFilterGpaMin, setGalleryFilterGpaMin] = useState("any");
  const [galleryFilterGpaMax, setGalleryFilterGpaMax] = useState("any");
  const [galleryFilterGradYear, setGalleryFilterGradYear] = useState("all");
  
  // Flowchart analysis state
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [flowchartKey, setFlowchartKey] = useState(0);
  const [flowchartLayout, setFlowchartLayout] = useState<'semester' | 'level' | 'department'>('semester');
  const [isRegeneratingFlowchart, setIsRegeneratingFlowchart] = useState(false);

  // Mobile detection
  const isMobile = useMobileDetection();

  // Appilix detection
  const [isAppilixEnv, setIsAppilixEnv] = useState(false);

  // Character limits for course form fields
  const courseCharLimits = {
    code: 10,
    name: 50,
    description: 200,
    professor: 50
  };

  const router = useRouter();
  const supabase = createClient();

  // Fetch roadmaps from Supabase
  useEffect(() => {
    fetchRoadmaps();
    fetchCanvasGpa();
  }, []);

  // Detect Appilix environment
  useEffect(() => {
    setIsAppilixEnv(isAppilixOrDevelopment());
  }, []);

  // Clear selected courses when filters change
  useEffect(() => {
    setSelectedCourses(new Set());
  }, [searchQuery, filterStatus, filterSemester]);

  // localStorage helper functions to remember user's selected roadmap
  // This ensures the user's last selected roadmap is restored when they return to the page
  
  // Helper function to get saved roadmap ID from localStorage
  const getSavedRoadmapId = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedRoadmapId');
    }
    return null;
  };

  // Helper function to save roadmap ID to localStorage
  const saveRoadmapId = (roadmapId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRoadmapId', roadmapId);
    }
  };

  // Helper function to remove saved roadmap ID from localStorage
  const removeSavedRoadmapId = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedRoadmapId');
    }
  };

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roadmaps');
      const data = await response.json();
      
      if (response.ok) {
        // Transform the data from Supabase format to frontend format
        const transformedRoadmaps = (data.roadmaps || []).map((roadmap: any) => ({
          id: roadmap.id,
          name: roadmap.name,
          major: roadmap.major,
          university: roadmap.universities?.name || 'Unknown University',
          totalCredits: roadmap.total_credits,
          completedCredits: roadmap.completed_credits,
          expectedGraduation: roadmap.expected_graduation,
          gpa: parseFloat(roadmap.current_gpa || '0'),
          isPublic: roadmap.is_public,
          showGpa: roadmap.show_gpa,
          createdBy: roadmap.user_id,
          createdAt: roadmap.created_at,
          updatedAt: roadmap.updated_at,
          semesters: (roadmap.roadmap_semesters || []).map((semester: any) => ({
            id: semester.id,
            name: semester.name,
            year: semester.year,
            season: semester.season as 'Fall' | 'Spring' | 'Summer',
            totalCredits: (semester.roadmap_courses || []).reduce((sum: number, course: any) => sum + (course.credits || 0), 0),
            courses: (semester.roadmap_courses || []).map((course: any) => ({
              id: course.id,
              code: course.course_code,
              name: course.course_name,
              credits: course.credits,
              semester: semester.name,
              year: semester.year,
              status: course.status as 'planned' | 'in-progress' | 'completed' | 'failed',
              grade: course.grade,
              prerequisites: course.prerequisites ? JSON.parse(course.prerequisites) : [],
              description: course.description,
              difficulty: course.difficulty_rating,
              professor: course.professor,
              professor_data: course.professor_data ? JSON.parse(course.professor_data) : null,
              rating: course.rating
            }))
          }))
        }));

        setRoadmaps(transformedRoadmaps);
        
        if (transformedRoadmaps.length > 0) {
          // Try to find the previously selected roadmap from localStorage
          const savedRoadmapId = getSavedRoadmapId();
          const savedRoadmap = savedRoadmapId ? transformedRoadmaps.find((r: DegreeRoadmap) => r.id === savedRoadmapId) : null;
          
          if (savedRoadmap) {
            // Use the saved roadmap if it exists
            setSelectedRoadmap(savedRoadmap);
          } else {
            // Fall back to the first roadmap and save it
            setSelectedRoadmap(transformedRoadmaps[0]);
            saveRoadmapId(transformedRoadmaps[0].id);
          }
        }
      } else {
        console.error('Error fetching roadmaps:', data.error);
        // Don't use sample data as fallback
        setRoadmaps([]);
        setSelectedRoadmap(null);
        removeSavedRoadmapId();
      }
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      // Don't use sample data as fallback
      setRoadmaps([]);
      setSelectedRoadmap(null);
      removeSavedRoadmapId();
    } finally {
      setLoading(false);
    }
  };

  const fetchCanvasGpa = async () => {
    try {
      const response = await fetch('/api/canvas/status');
      const data = await response.json();
      
      if (data.success && data.integration?.gpa && data.isConnected) {
        setCanvasGpa(data.integration.gpa.toString());
      } else {
        // User has no Canvas integration or it's disconnected
        setCanvasGpa('0.0');
      }
      setCanvasChecked(true);
    } catch (error) {
      console.error('Error fetching Canvas GPA:', error);
      // Set to 0.0 on error as well
      setCanvasGpa('0.0');
      setCanvasChecked(true);
    }
  };

  const handleRoadmapCreated = (newRoadmap: any) => {
    // Refresh the roadmaps list - fetchRoadmaps will handle localStorage selection
    fetchRoadmaps();
  };

  // Calculate progress statistics
  const hasCanvasIntegration = canvasGpa && parseFloat(canvasGpa) > 0;
  const roadmapGpa = calculateGPA(selectedRoadmap);
  const canvasGpaValue = hasCanvasIntegration ? parseFloat(canvasGpa) : 0.0;
  
  // Calculate completed courses with grades for display
  const completedCoursesWithGrades = selectedRoadmap?.semesters
    .flatMap(semester => semester.courses)
    .filter(course => 
      (course.status === 'completed' || course.status === 'failed') && 
      course.grade && 
      course.grade.trim() !== '' &&
      // Only count grades that contribute to GPA
      !['W', 'I', 'P', 'NP'].includes(course.grade.trim())
    ) || [];
  
  const progressStats = {
    totalCredits: selectedRoadmap?.totalCredits || 0,
    completedCredits: selectedRoadmap?.completedCredits || 0,
    remainingCredits: (selectedRoadmap?.totalCredits || 0) - (selectedRoadmap?.completedCredits || 0),
    progressPercentage: selectedRoadmap ? (selectedRoadmap.completedCredits / selectedRoadmap.totalCredits) * 100 : 0,
    roadmapGPA: roadmapGpa,
    canvasGPA: canvasGpaValue,
    expectedGraduation: selectedRoadmap?.expectedGraduation || 'Not set',
    completedCoursesWithGradesCount: completedCoursesWithGrades.length
  };

  // Handle course editing
  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedProfessor(course.professor_data || null);
    setCourseFormData({
      code: course.code,
      name: course.name,
      credits: course.credits,
      description: course.description || "",
      status: course.status,
      grade: course.grade || "",
      difficulty: course.difficulty || 1,
      professor: course.professor || ""
    });
    setCourseFormErrors({});
    setIsEditingCourse(true);
  };

  // Handle course deletion
  const handleDeleteCourse = async (courseId: string) => {
    if (!selectedRoadmap) return;
    
    try {
      const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/courses`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        // Refresh roadmaps to get updated data
        fetchRoadmaps();
      } else {
        console.error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  // Handle adding new course
  const handleAddCourse = (semesterId: string) => {
    setSelectedCourse(null);
    setSelectedSemesterId(semesterId);
    setSelectedProfessor(null);
    setCourseFormData({
      code: "",
      name: "",
      credits: 3,
      description: "",
      status: "planned",
      grade: "",
      difficulty: 1,
      professor: ""
    });
    setCourseFormErrors({});
    setIsEditingCourse(true);
  };

  // Handle adding new semester
  const handleAddSemester = () => {
    setIsAddingSemester(true);
  };

  // Handle saving course
  const handleSaveCourse = async () => {
    if (!selectedRoadmap) return;

    // Validate form before saving
    if (!(await validateCourseForm())) {
      return;
    }

    const semesterId = selectedCourse ? 
      selectedRoadmap.semesters.find(s => s.courses.some(c => c.id === selectedCourse.id))?.id :
      selectedSemesterId;

    if (!semesterId) return;

    try {
      const courseData: any = {
        semester_id: semesterId,
        course_code: courseFormData.code,
        course_name: courseFormData.name,
        credits: courseFormData.credits,
        status: courseFormData.status,
        grade: courseFormData.grade || null,
        professor: courseFormData.professor || null,
        difficulty_rating: courseFormData.difficulty,
        description: courseFormData.description || null,
        professor_data: selectedProfessor ? JSON.stringify(selectedProfessor) : null
      };

      const url = `/api/roadmaps/${selectedRoadmap.id}/courses`;
      const method = selectedCourse ? 'PUT' : 'POST';
      
      if (selectedCourse) {
        courseData.id = selectedCourse.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        setIsEditingCourse(false);
        setSelectedCourse(null);
        setSelectedSemesterId(null);
        setCourseFormErrors({});
        fetchRoadmaps(); // Refresh data
      } else {
        console.error('Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  // Handle saving semester
  const handleSaveSemester = async (semesterData: { name: string; year: number; season: string }) => {
    if (!selectedRoadmap) return;

    try {
      const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/semesters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(semesterData),
      });

      if (response.ok) {
        setIsAddingSemester(false);
        fetchRoadmaps(); // Refresh data
      } else {
        console.error('Failed to add semester');
      }
    } catch (error) {
      console.error('Error adding semester:', error);
    }
  };

  // Handle deleting semester
  const handleDeleteSemester = async (semesterId: string) => {
    if (!selectedRoadmap) return;
    
    try {
      const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/semesters`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ semesterId }),
      });

      if (response.ok) {
        fetchRoadmaps(); // Refresh data
      } else {
        console.error('Failed to delete semester');
      }
    } catch (error) {
      console.error('Error deleting semester:', error);
    }
  };

  // Handle editing settings
  const handleEditSettings = () => {
    if (!selectedRoadmap) return;
    
    setSettingsFormData({
      name: selectedRoadmap.name,
      major: selectedRoadmap.major,
      expectedGraduation: selectedRoadmap.expectedGraduation,
      totalCredits: selectedRoadmap.totalCredits,
      isPublic: selectedRoadmap.isPublic,
      showGpa: selectedRoadmap.showGpa
    });
    setSettingsErrors({});
    setIsEditingSettings(true);
  };

  // Handle saving settings
  const handleSaveSettings = async () => {
    if (!selectedRoadmap) return;

    // Reset errors
    setSettingsErrors({});

    // Validate form data
    const newErrors: { [key: string]: string } = {};

    if (!settingsFormData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!settingsFormData.major.trim()) {
      newErrors.major = "Major is required";
    }

    if (settingsFormData.totalCredits <= 0 || settingsFormData.totalCredits < 30 || settingsFormData.totalCredits > 200) {
      newErrors.totalCredits = "Total credits must be between 30 and 200";
    }

    // If there are validation errors, show them and return
    if (Object.keys(newErrors).length > 0) {
      setSettingsErrors(newErrors);
      return;
    }

    // Ensure totalCredits is valid
    const totalCredits = settingsFormData.totalCredits && settingsFormData.totalCredits > 0 
      ? settingsFormData.totalCredits 
      : 120;

    try {
      // Calculate the current GPA based on courses
      const calculatedGpa = calculateGPA(selectedRoadmap);
      
      const requestBody = {
        name: settingsFormData.name,
        major: settingsFormData.major,
        expected_graduation: settingsFormData.expectedGraduation,
        total_credits: totalCredits,
        is_public: settingsFormData.isPublic,
        show_gpa: settingsFormData.showGpa,
        current_gpa: calculatedGpa
      };

      const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setIsEditingSettings(false);
        setSettingsErrors({});
        fetchRoadmaps(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('Failed to update roadmap settings:', errorData);
        setSettingsErrors({ submit: errorData.error || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Error updating roadmap settings:', error);
      setSettingsErrors({ submit: 'Failed to update settings. Please try again.' });
    }
  };

  // Handle canceling settings edit
  const handleCancelSettings = () => {
    setIsEditingSettings(false);
    setSettingsErrors({});
    setSettingsFormData({
      name: "",
      major: "",
      expectedGraduation: "",
      totalCredits: 120,
      isPublic: false,
      showGpa: true
    });
  };

  // Handle bulk actions
  const handleBulkStatusUpdate = async (newStatus: Course['status']) => {
    if (!selectedRoadmap || selectedCourses.size === 0) return;

    setIsPerformingBulkAction(true);
    try {
      // Get all courses data to find the selected ones
      const allCourses = selectedRoadmap.semesters.flatMap(s => 
        s.courses.map(course => ({
          ...course,
          semesterName: s.name,
          semesterId: s.id
        }))
      );
      
      const selectedCoursesData = allCourses.filter(course => selectedCourses.has(course.id));

      // Update each selected course with all required fields
      const updatePromises = selectedCoursesData.map(async (course) => {
        const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/courses`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: course.id,
            semester_id: course.semesterId,
            course_code: course.code,
            course_name: course.name,
            credits: course.credits,
            status: newStatus,
            grade: course.grade || null,
            professor: course.professor || null,
            difficulty_rating: course.difficulty || null,
            description: course.description || null,
            professor_data: course.professor_data ? JSON.stringify(course.professor_data) : null
          }),
        });
        return response.ok;
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;

      if (successCount === selectedCourses.size) {
        // All updates successful
        setSelectedCourses(new Set());
        fetchRoadmaps(); // Refresh data
      } else {
        console.error(`Only ${successCount} out of ${selectedCourses.size} courses were updated`);
      }
    } catch (error) {
      console.error('Error performing bulk status update:', error);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedRoadmap || selectedCourses.size === 0) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedCourses.size} selected course${selectedCourses.size !== 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsPerformingBulkAction(true);
    try {
      // Delete each selected course
      const deletePromises = Array.from(selectedCourses).map(async (courseId) => {
        const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/courses`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseId }),
        });
        return response.ok;
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;

      if (successCount === selectedCourses.size) {
        // All deletions successful
        setSelectedCourses(new Set());
        fetchRoadmaps(); // Refresh data
      } else {
        console.error(`Only ${successCount} out of ${selectedCourses.size} courses were deleted`);
      }
    } catch (error) {
      console.error('Error performing bulk delete:', error);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  const handleBulkMoveSemester = async (targetSemesterId: string) => {
    if (!selectedRoadmap || selectedCourses.size === 0) return;

    setIsPerformingBulkAction(true);
    try {
      // Get all courses data to find the selected ones
      const allCourses = selectedRoadmap.semesters.flatMap(s => 
        s.courses.map(course => ({
          ...course,
          semesterName: s.name,
          semesterId: s.id
        }))
      );
      
      const selectedCoursesData = allCourses.filter(course => selectedCourses.has(course.id));

      // Update each selected course to move to the target semester
      const updatePromises = selectedCoursesData.map(async (course) => {
        const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}/courses`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: course.id,
            semester_id: targetSemesterId,
            course_code: course.code,
            course_name: course.name,
            credits: course.credits,
            status: course.status,
            grade: course.grade || null,
            professor: course.professor || null,
            difficulty_rating: course.difficulty || null,
            description: course.description || null,
            professor_data: course.professor_data ? JSON.stringify(course.professor_data) : null
          }),
        });
        return response.ok;
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(Boolean).length;

      if (successCount === selectedCourses.size) {
        // All updates successful
        setSelectedCourses(new Set());
        fetchRoadmaps(); // Refresh data
      } else {
        console.error(`Only ${successCount} out of ${selectedCourses.size} courses were moved`);
      }
    } catch (error) {
      console.error('Error performing bulk semester move:', error);
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  const handleBulkExport = () => {
    if (!selectedRoadmap || selectedCourses.size === 0) return;

    // Get selected courses data
    const allCourses = selectedRoadmap.semesters.flatMap(s => 
      s.courses.map(course => ({
        ...course,
        semesterName: s.name,
        semesterId: s.id
      }))
    );
    
    const selectedCoursesData = allCourses.filter(course => selectedCourses.has(course.id));

    // Create CSV content
    const csvHeaders = [
      'Course Code',
      'Course Name', 
      'Credits',
      'Semester',
      'Status',
      'Grade',
      'Professor',
      'Difficulty',
      'Description'
    ];

    const csvRows = selectedCoursesData.map(course => [
      course.code,
      course.name,
      course.credits.toString(),
      course.semesterName,
      course.status,
      course.grade || '',
      course.professor || '',
      course.difficulty?.toString() || '',
      course.description || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `courses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAllCourses = (checked: boolean) => {
    if (!selectedRoadmap) return;

    if (checked) {
      // Select all filtered courses
      const allCourses = selectedRoadmap.semesters.flatMap(s => 
        s.courses.map(course => ({
          ...course,
          semesterName: s.name,
          semesterId: s.id
        }))
      );
      
      const filteredCourses = allCourses.filter(course => {
        const matchesSearch = searchQuery === "" || 
          course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || course.status === filterStatus;
        const matchesSemester = filterSemester === "all" || course.semesterId === filterSemester;
        return matchesSearch && matchesStatus && matchesSemester;
      });

      setSelectedCourses(new Set(filteredCourses.map(c => c.id)));
    } else {
      setSelectedCourses(new Set());
    }
  };

  const handleSelectCourse = (courseId: string, checked: boolean) => {
    const newSelected = new Set(selectedCourses);
    if (checked) {
      newSelected.add(courseId);
    } else {
      newSelected.delete(courseId);
    }
    setSelectedCourses(newSelected);
  };

  // Validate course form
  const validateCourseForm = async (): Promise<boolean> => {
    const newErrors: { [key: string]: string } = {};

    // Validate course code
    if (!courseFormData.code.trim()) {
      newErrors.code = "Course code is required";
    } else {
      // Validate course code format (e.g., CS101, MATH200)
      const courseCodeRegex = /^[A-Z]{2,4}\d{3,4}$/;
      if (!courseCodeRegex.test(courseFormData.code.trim())) {
        newErrors.code = "Please enter a valid course code (e.g., CS101, MATH200)";
      }
    }

    // Validate course name
    if (!courseFormData.name.trim()) {
      newErrors.name = "Course name is required";
    }

    // Validate credits
    if (courseFormData.credits <= 0 || courseFormData.credits > 12) {
      newErrors.credits = "Credits must be between 1 and 12";
    }

    // Check for bad words in text fields
    const { containsBadWords } = await import('@/utils/badWords');

    // Check course name for bad words
    if (courseFormData.name && await containsBadWords(courseFormData.name)) {
      newErrors.name = "Course name contains inappropriate language";
    }

    // Check description for bad words
    if (courseFormData.description && await containsBadWords(courseFormData.description)) {
      newErrors.description = "Description contains inappropriate language";
    }

    // Check professor name for bad words
    if (courseFormData.professor && await containsBadWords(courseFormData.professor)) {
      newErrors.professor = "Professor name contains inappropriate language";
    }

    setCourseFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle delete roadmap
  const handleDeleteRoadmap = async () => {
    if (!selectedRoadmap) return;
    
    setIsDeletingRoadmap(true);
    try {
      const response = await fetch(`/api/roadmaps/${selectedRoadmap.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the deleted roadmap from the list
        const updatedRoadmaps = roadmaps.filter(r => r.id !== selectedRoadmap.id);
        setRoadmaps(updatedRoadmaps);
        
        // Select the first remaining roadmap or null if none
        const newSelectedRoadmap = updatedRoadmaps.length > 0 ? updatedRoadmaps[0] : null;
        setSelectedRoadmap(newSelectedRoadmap);
        
        // Update localStorage
        if (newSelectedRoadmap) {
          saveRoadmapId(newSelectedRoadmap.id);
        } else {
          removeSavedRoadmapId();
        }
        
        setIsDeleteDialogOpen(false);
        // Show success message (you can add a toast here if needed)
      } else {
        const data = await response.json();
        console.error('Error deleting roadmap:', data.error);
        // Show error message (you can add a toast here if needed)
      }
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      // Show error message (you can add a toast here if needed)
    } finally {
      setIsDeletingRoadmap(false);
    }
  };

  // Handle import courses
  const handleImportCourses = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['code', 'name', 'credits'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }
      
      const coursesToImport = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim());
        const courseData: any = {};
        
        headers.forEach((header, index) => {
          courseData[header] = values[index] || '';
        });
        
        // Validate course data
        if (!courseData.code || !courseData.name) continue;
        
        coursesToImport.push({
          code: courseData.code,
          name: courseData.name,
          credits: parseInt(courseData.credits) || 3,
          description: courseData.description || '',
          status: 'planned' as Course['status'],
          grade: '',
          difficulty: 1,
          professor: courseData.professor || ''
        });
      }
      
      if (coursesToImport.length === 0) {
        alert('No valid courses found in the file');
        return;
      }
      
      // Get the first semester to add courses to, or create one if none exists
      let targetSemesterId = selectedRoadmap?.semesters[0]?.id;
      
      if (!targetSemesterId) {
        // Create a default semester first
        const semesterResponse = await fetch('/api/roadmaps/semesters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roadmap_id: selectedRoadmap?.id,
            name: 'Imported Courses',
            year: new Date().getFullYear(),
            season: 'Fall'
          })
        });
        
        if (semesterResponse.ok) {
          const semesterData = await semesterResponse.json();
          targetSemesterId = semesterData.semester.id;
        } else {
          alert('Failed to create semester for imported courses');
          return;
        }
      }
      
      // Import courses one by one
      let successCount = 0;
      for (const course of coursesToImport) {
        try {
          const response = await fetch('/api/roadmaps/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...course,
              semester_id: targetSemesterId
            })
          });

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error('Error importing course:', course.code, error);
        }
      }

      // Refresh roadmaps to show imported courses
      await fetchRoadmaps();
      
      alert(`Successfully imported ${successCount} out of ${coursesToImport.length} courses`);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing courses:', error);
      alert('Error importing courses. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fetch public roadmaps for gallery
  const fetchPublicRoadmaps = async () => {
    try {
      setLoadingPublicRoadmaps(true);
      const response = await fetch('/api/roadmaps/public');
      const data = await response.json();
      
      if (response.ok) {
        setPublicRoadmaps(data.roadmaps || []);
      } else {
        console.error('Error fetching public roadmaps:', data.error);
        setPublicRoadmaps([]);
      }
    } catch (error) {
      console.error('Error fetching public roadmaps:', error);
      setPublicRoadmaps([]);
    } finally {
      setLoadingPublicRoadmaps(false);
    }
  };

  // Handle flowchart analysis completion
  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setShowAnalysisResults(true);
  };

  // Handle importing selected courses and pathways from analysis
  const handleAnalysisImport = async (selectedCourses: any[], selectedPath?: any) => {
    console.log('Import started with:', { selectedCourses, selectedPath, selectedRoadmap });
    
    try {
      // Check if a roadmap is selected
      if (!selectedRoadmap) {
        alert('Please select a roadmap first before importing courses.');
        return;
      }

      // Import selected courses to the current roadmap
      if (selectedCourses.length > 0) {
        // Get the first semester or create one if none exists
        let targetSemester: Semester | undefined = selectedRoadmap.semesters[0];
        if (!targetSemester) {
          // Create a default semester
          const semesterData = {
            name: 'Fall 2024',
            year: 2024,
            season: 'Fall'
          };
          await handleSaveSemester(semesterData);
          await fetchRoadmaps(); // Refresh to get the new semester
          const updatedRoadmap = roadmaps.find(r => r.id === selectedRoadmap.id);
          targetSemester = updatedRoadmap?.semesters[0];
        }

        if (targetSemester && targetSemester.id) {
          // Add each selected course
          for (const course of selectedCourses) {
            const courseData = {
              course_code: course.code,
              course_name: course.name,
              credits: course.credits,
              status: course.status === 'completed' ? 'completed' : 'planned',
              semester_id: targetSemester.id,
              description: '',
              professor: '',
              difficulty_rating: 3,
              grade: course.status === 'completed' ? 'A' : undefined
            };

            console.log('Adding course:', courseData);

            const courseResponse = await fetch(`/api/roadmaps/${selectedRoadmap.id}/courses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(courseData)
            });

            if (!courseResponse.ok) {
              console.error('Failed to add course:', course.code, await courseResponse.text());
            } else {
              console.log('Successfully added course:', course.code);
            }
          }

          // Refresh roadmaps to show new courses
          await fetchRoadmaps();
          
          alert(`Successfully imported ${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''}${selectedPath ? ` and ${selectedPath.name} pathway` : ''}!`);
        } else {
          alert('Unable to find or create a semester for importing courses.');
        }
      } else {
        alert('No courses selected for import.');
      }
    } catch (error) {
      console.error('Error importing analysis results:', error);
      alert('Error importing courses. Please try again.');
    }
    
    setShowAnalysisResults(false);
  };

  // Handle flowchart regeneration
  const handleRegenerateFlowchart = async () => {
    setIsRegeneratingFlowchart(true);
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    setFlowchartKey(prev => prev + 1);
    setIsRegeneratingFlowchart(false);
  };

  // Handle layout change
  const handleLayoutChange = (newLayout: 'semester' | 'level' | 'department') => {
    setFlowchartLayout(newLayout);
    setFlowchartKey(prev => prev + 1);
  };

  // Import roadmap from public gallery
  const handleImportPublicRoadmap = async (roadmapId: string) => {
    try {
      const response = await fetch(`/api/roadmaps/public/${roadmapId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Roadmap imported successfully!');
        await fetchRoadmaps(); // Refresh user's roadmaps
        setActiveTab('roadmap'); // Switch to roadmap tab
      } else {
        const error = await response.json();
        alert(`Failed to import roadmap: ${error.message}`);
      }
    } catch (error) {
      console.error('Error importing roadmap:', error);
      alert('Error importing roadmap. Please try again.');
    }
  };

  // Fetch public roadmaps when gallery tab is accessed
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchPublicRoadmaps();
    }
  }, [activeTab]);

  // Helper function to sort semesters chronologically
  const sortSemestersChronologically = (semesters: Semester[]) => {
    return [...semesters].sort((a, b) => {
      // First sort by year
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      
      // Then sort by season within the same year
      const seasonOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
      return seasonOrder[a.season] - seasonOrder[b.season];
    });
  };

  if (loading) {
    return (
      <ClientSubscriptionCheck redirectTo="/pricing">
        <div className="container mx-auto px-4 py-8 pb-15 md:pb-8 flex flex-col gap-8">
          <DynamicPageTitle title="UniShare | Degree Roadmap" />
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your degree roadmaps...</p>
            </div>
          </div>
        </div>
      </ClientSubscriptionCheck>
    );
  }

  return (
    <ClientSubscriptionCheck redirectTo="/pricing">
      <div className="container mx-auto px-4 py-8 pb-15 md:pb-8 flex flex-col gap-8">
        <DynamicPageTitle title="UniShare | Degree Roadmap" />

        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Degree Roadmap</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Plan and track your academic journey
              </p>
            </div>
            <div className="flex items-center gap-2 md:flex-shrink-0">
              {selectedRoadmap && (
                <ShareRoadmapButton 
                  roadmapId={selectedRoadmap.id}
                  roadmapName={selectedRoadmap.name}
                  roadmapDescription={`${selectedRoadmap.major} degree roadmap at ${selectedRoadmap.university}`}
                />
              )}
              <CreateRoadmapDialog
                onRoadmapCreated={handleRoadmapCreated}
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Roadmap
                  </Button>
                }
              />
            </div>
          </div>
        </header>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{progressStats.completedCredits} / {progressStats.totalCredits} credits</span>
                  <span className="font-medium">{progressStats.progressPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={progressStats.progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Roadmap GPA
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Calculated
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{progressStats.roadmapGPA.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/ 4.0</span>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              {(() => {
                if (progressStats.completedCoursesWithGradesCount === 0) {
                  return (
                    <p className="text-xs text-orange-600 mt-1">
                      No graded courses yet
                    </p>
                  );
                } else {
                  return (
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {progressStats.completedCoursesWithGradesCount} graded course{progressStats.completedCoursesWithGradesCount !== 1 ? 's' : ''} (excludes W, I, P, NP)
                    </p>
                  );
                }
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Canvas GPA
                {hasCanvasIntegration && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                )}
                {canvasChecked && canvasGpa === '0.0' && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{progressStats.canvasGPA.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/ 4.0</span>
                {hasCanvasIntegration ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
              {hasCanvasIntegration ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Synced from Canvas LMS
                </p>
              ) : (
                <div className="mt-1">
                  <p className="text-xs text-orange-600">
                    Connect Canvas to view your GPA
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    onClick={() => router.push('/dashboard/profile/edit')}
                  >
                    Connect Canvas →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expected Graduation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-medium">{progressStats.expectedGraduation}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{progressStats.remainingCredits}</div>
                <div className="text-sm text-muted-foreground">credits left</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile Tabs - only show on mobile */}
          {isMobile && (
            <MobileTabs
              tabs={[
                { value: "roadmap", label: "Roadmap" },
                { value: "courses", label: "Courses" },
                { value: "flowchart", label: "Chart" },
                { value: "gallery", label: "Gallery" },
                { value: "analytics", label: "Analytics" },
                { value: "settings", label: "Settings" }
              ]}
              activeTab={activeTab}
              className="mb-6"
              onTabChange={setActiveTab}
            />
          )}

          {/* Desktop Tabs - only show on desktop */}
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="courses">
                <span className="hidden sm:inline">All Courses</span>
                <span className="sm:hidden">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="flowchart">
                <span className="hidden sm:inline">Flowchart</span>
                <span className="sm:hidden">Chart</span>
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <span className="hidden sm:inline">Public Gallery</span>
                <span className="sm:hidden">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          )}

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                {roadmaps.length > 1 ? (
                  <div className="space-y-2">
                    <Label htmlFor="roadmap-select" className="text-sm font-medium">
                      Select Roadmap
                    </Label>
                    <Select
                      value={selectedRoadmap?.id || ''}
                      onValueChange={(value) => {
                        const roadmap = roadmaps.find(r => r.id === value);
                        setSelectedRoadmap(roadmap || null);
                        // Save the selected roadmap ID to localStorage
                        if (roadmap) {
                          saveRoadmapId(roadmap.id);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full lg:w-64 truncate [&>span]:truncate [&>span]:overflow-hidden [&>span]:whitespace-nowrap">
                        <SelectValue placeholder="Select a roadmap" className="truncate overflow-hidden whitespace-nowrap" />
                      </SelectTrigger>
                      <SelectContent>
                        {roadmaps.map((roadmap) => (
                          <SelectItem key={roadmap.id} value={roadmap.id} className="truncate">
                            <span className="truncate overflow-hidden whitespace-nowrap block max-w-full">
                              {roadmap.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : selectedRoadmap ? (
                  <div>
                    <h2 className="text-xl font-semibold">{selectedRoadmap.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoadmap.major} • {selectedRoadmap.university}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold">No Roadmap Selected</h2>
                    <p className="text-sm text-muted-foreground">
                      Create a roadmap to get started
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Semesters */}
            <div className="space-y-6">
              {selectedRoadmap ? (
                (() => {
                  const filteredSemesters = selectedRoadmap.semesters.filter(semester => {
                    const filteredCourses = semester.courses.filter(course => {
                      const matchesSearch = searchQuery === "" || 
                        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (course.professor && course.professor.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (course.professor_data && 
                          (`${course.professor_data.firstName} ${course.professor_data.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
                      
                      const matchesStatus = filterStatus === "all" || course.status === filterStatus;
                      
                      return matchesSearch && matchesStatus;
                    });
                    return filteredCourses.length > 0 || (searchQuery === "" && filterStatus === "all");
                  });

                  if (filteredSemesters.length === 0 && (searchQuery !== "" || filterStatus !== "all")) {
                    return (
                      <Card className="border-dashed border-2">
                        <CardContent className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-2">No Courses Found</h3>
                            <p className="text-muted-foreground mb-4">
                              No courses match your search criteria across all semesters
                            </p>
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" onClick={() => setSearchQuery("")}>
                                Clear Search
                              </Button>
                              <Button variant="outline" onClick={() => setFilterStatus("all")}>
                                Clear Filter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <>
                      {sortSemestersChronologically(selectedRoadmap.semesters).map((semester: Semester) => (
                        <SemesterSection
                          key={semester.id}
                          semester={semester}
                          onEditCourse={handleEditCourse}
                          onDeleteCourse={handleDeleteCourse}
                          onAddCourse={handleAddCourse}
                          onDeleteSemester={handleDeleteSemester}
                          searchQuery={searchQuery}
                          filterStatus={filterStatus}
                        />
                      ))}
                    </>
                  );
                })()
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No Roadmap Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first degree roadmap to start planning your academic journey
                      </p>
                      <CreateRoadmapDialog
                        onRoadmapCreated={handleRoadmapCreated}
                        trigger={
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Roadmap
                          </Button>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Add semester button - only show if roadmap exists */}
              {selectedRoadmap && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent 
                    className="flex items-center justify-center py-8"
                    onClick={handleAddSemester}
                  >
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Add Semester</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            {selectedRoadmap ? (
              <div className="space-y-6">
                {/* Course Management Header */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">All Courses</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage all courses across your degree roadmap
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportCourses}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Courses
                    </Button>
                    <Button onClick={() => {
                      // Ensure we have a valid semester to add the course to
                      const targetSemesterId = selectedRoadmap.semesters[0]?.id;
                      if (targetSemesterId) {
                        handleAddCourse(targetSemesterId);
                      } else {
                        // If no semesters exist, we could show a message or create one automatically
                        alert('Please create a semester first before adding courses.');
                      }
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Course
                    </Button>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search courses by name or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterSemester} onValueChange={setFilterSemester}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Semesters</SelectItem>
                            {sortSemestersChronologically(selectedRoadmap.semesters).map((semester) => (
                              <SelectItem key={semester.id} value={semester.id}>
                                {semester.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {(() => {
                          const allCourses = selectedRoadmap.semesters.flatMap(s => s.courses);
                          return allCourses.length;
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Courses</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          const allCourses = selectedRoadmap.semesters.flatMap(s => s.courses);
                          return allCourses.filter(c => c.status === 'completed').length;
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(() => {
                          const allCourses = selectedRoadmap.semesters.flatMap(s => s.courses);
                          return allCourses.filter(c => c.status === 'in-progress').length;
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {(() => {
                          const allCourses = selectedRoadmap.semesters.flatMap(s => s.courses);
                          return allCourses.filter(c => c.status === 'planned').length;
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground">Planned</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Courses Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Course List</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {(() => {
                            const allCourses = selectedRoadmap.semesters.flatMap(s => 
                              s.courses.map(course => ({
                                ...course,
                                semesterName: s.name,
                                semesterId: s.id
                              }))
                            );
                            
                            const filteredCourses = allCourses.filter(course => {
                              const matchesSearch = searchQuery === "" || 
                                course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                course.code.toLowerCase().includes(searchQuery.toLowerCase());
                              const matchesStatus = filterStatus === "all" || course.status === filterStatus;
                              const matchesSemester = filterSemester === "all" || course.semesterId === filterSemester;
                              return matchesSearch && matchesStatus && matchesSemester;
                            });
                            return filteredCourses.length;
                          })()} courses shown
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium w-12">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={(() => {
                                  const allCourses = selectedRoadmap.semesters.flatMap(s => 
                                    s.courses.map(course => ({
                                      ...course,
                                      semesterName: s.name,
                                      semesterId: s.id
                                    }))
                                  );
                                  
                                  const filteredCourses = allCourses.filter(course => {
                                    const matchesSearch = searchQuery === "" || 
                                      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      course.code.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesStatus = filterStatus === "all" || course.status === filterStatus;
                                    const matchesSemester = filterSemester === "all" || course.semesterId === filterSemester;
                                    return matchesSearch && matchesStatus && matchesSemester;
                                  });

                                  return filteredCourses.length > 0 && filteredCourses.every(course => selectedCourses.has(course.id));
                                })()}
                                onChange={(e) => handleSelectAllCourses(e.target.checked)}
                              />
                            </th>
                            <th className="text-left p-4 font-medium">Course</th>
                            <th className="text-left p-4 font-medium">Credits</th>
                            <th className="text-left p-4 font-medium">Semester</th>
                            <th className="text-left p-4 font-medium">Status</th>
                            <th className="text-left p-4 font-medium">Grade</th>
                            <th className="text-left p-4 font-medium">Professor</th>
                            <th className="text-left p-4 font-medium">Difficulty</th>
                            <th className="text-right p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const allCourses = selectedRoadmap.semesters.flatMap(s => 
                              s.courses.map(course => ({
                                ...course,
                                semesterName: s.name,
                                semesterId: s.id
                              }))
                            );
                            
                            const filteredCourses = allCourses.filter(course => {
                              const matchesSearch = searchQuery === "" || 
                                course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                course.code.toLowerCase().includes(searchQuery.toLowerCase());
                              const matchesStatus = filterStatus === "all" || course.status === filterStatus;
                              const matchesSemester = filterSemester === "all" || course.semesterId === filterSemester;
                              return matchesSearch && matchesStatus && matchesSemester;
                            });

                            if (filteredCourses.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                                    {searchQuery || filterStatus !== "all" || filterSemester !== "all" 
                                      ? "No courses match your filters" 
                                      : "No courses found"}
                                  </td>
                                </tr>
                              );
                            }

                            return filteredCourses.map((course) => (
                              <tr key={course.id} className="border-b hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={selectedCourses.has(course.id)}
                                    onChange={(e) => handleSelectCourse(course.id, e.target.checked)}
                                  />
                                </td>
                                <td className="p-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {course.code}
                                      </Badge>
                                    </div>
                                    <div className="font-medium text-sm">{course.name}</div>
                                    {course.description && (
                                      <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                        {course.description}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm font-medium">{course.credits}</span>
                                </td>
                                <td className="p-4">
                                  <span className="text-sm">{course.semesterName}</span>
                                </td>
                                <td className="p-4">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className={`text-xs ${getStatusColor(course.status)} max-w-24 truncate`}>
                                          <div className="flex items-center gap-1 truncate">
                                            {getStatusIcon(course.status)}
                                            <span className="truncate">{course.status}</span>
                                          </div>
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="capitalize">{course.status.replace('-', ' ')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </td>
                                <td className="p-4">
                                  {course.grade ? (
                                    <span className="text-sm font-medium">{course.grade}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {course.professor_data ? (
                                    <div className="text-sm">
                                      <div>{course.professor_data.firstName} {course.professor_data.lastName}</div>
                                      {course.professor_data.rating && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          {course.professor_data.rating.toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  ) : course.professor ? (
                                    <span className="text-sm">{course.professor}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {course.difficulty ? (
                                    <DifficultyStars difficulty={course.difficulty} />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleEditCourse(course)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit course</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteCourse(course.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Delete course</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bulk Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Bulk Actions</CardTitle>
                    <CardDescription>
                      {selectedCourses.size > 0 
                        ? `${selectedCourses.size} course${selectedCourses.size !== 1 ? 's' : ''} selected`
                        : 'Select courses to perform bulk actions'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={selectedCourses.size === 0 || isPerformingBulkAction}
                        onClick={() => handleBulkStatusUpdate('completed')}
                      >
                        {isPerformingBulkAction ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Completed
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={selectedCourses.size === 0 || isPerformingBulkAction}
                        onClick={() => handleBulkStatusUpdate('in-progress')}
                      >
                        {isPerformingBulkAction ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2" />
                        )}
                        Mark as In Progress
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={selectedCourses.size === 0 || isPerformingBulkAction}
                        onClick={() => handleBulkStatusUpdate('planned')}
                      >
                        {isPerformingBulkAction ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Planned
                      </Button>
                      
                      {/* Move to Semester Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={selectedCourses.size === 0 || isPerformingBulkAction}
                          >
                            {isPerformingBulkAction ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Calendar className="h-4 w-4 mr-2" />
                            )}
                            Move to Semester
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {sortSemestersChronologically(selectedRoadmap?.semesters || []).map((semester) => (
                            <DropdownMenuItem
                              key={semester.id}
                              onClick={() => handleBulkMoveSemester(semester.id)}
                            >
                              {semester.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={selectedCourses.size === 0}
                        onClick={handleBulkExport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        disabled={selectedCourses.size === 0 || isPerformingBulkAction}
                        onClick={handleBulkDelete}
                      >
                        {isPerformingBulkAction ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Selected
                      </Button>
                    </div>
                    {selectedCourses.size === 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Select courses using the checkboxes to enable bulk actions
                      </p>
                    )}
                    {selectedCourses.size > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedCourses(new Set())}
                          className="text-xs"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Roadmap Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a roadmap to view and manage your courses
                </p>
              </div>
            )}
          </TabsContent>

          {/* Flowchart Tab */}
          <TabsContent value="flowchart" className="space-y-6">
            {selectedRoadmap ? (
              <div className="space-y-6">
                {/* Flowchart Controls */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Flowchart Controls
                        </CardTitle>
                        <CardDescription>
                          Customize your roadmap visualization
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={flowchartLayout} onValueChange={handleLayoutChange}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semester">By Semester</SelectItem>
                            <SelectItem value="level">By Course Level</SelectItem>
                            <SelectItem value="department">By Department</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleRegenerateFlowchart}
                          disabled={isRegeneratingFlowchart}
                          variant="outline"
                        >
                          {isRegeneratingFlowchart ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Flowchart Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedRoadmap.semesters.reduce((total, semester) => total + semester.courses.length, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Courses</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedRoadmap.semesters.reduce((total, semester) => 
                          total + semester.courses.filter(c => c.status === 'completed').length, 0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedRoadmap.semesters.reduce((total, semester) => 
                          total + semester.courses.filter(c => c.status === 'in-progress').length, 0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedRoadmap.semesters.reduce((total, semester) => 
                          total + semester.courses.filter(c => c.status === 'planned').length, 0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Planned</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Flowchart Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Roadmap Flowchart
                      <Badge variant="outline" className="ml-2">
                        {flowchartLayout === 'semester' ? 'Semester View' : 
                         flowchartLayout === 'level' ? 'Level View' : 'Department View'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Visual representation of your degree roadmap with course connections and prerequisites
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoadmapThumbnail 
                      key={flowchartKey}
                      roadmap={{
                        ...selectedRoadmap,
                        courses: selectedRoadmap.semesters.flatMap(s => s.courses.map(c => ({
                          ...c,
                          semester_id: s.id
                        })))
                      }} 
                      className="w-full h-full"
                    />
                    
                    {/* Flowchart Legend and Info */}
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Course Status Legend</h4>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span>Completed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span>In Progress</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              <span>Planned</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span>Failed</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Flowchart Features</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Dotted lines show prerequisite connections</li>
                            <li>• Course positioning based on {flowchartLayout === 'semester' ? 'semester order' : flowchartLayout === 'level' ? 'course level' : 'department grouping'}</li>
                            <li>• Interactive regeneration with different layouts</li>
                            <li>• Real-time status updates from your roadmap</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Flowchart Analysis
                    </CardTitle>
                    <CardDescription>
                      Upload a flowchart image for AI-powered course extraction and analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FlowchartUpload 
                      onAnalysisComplete={handleAnalysisComplete}
                      userCourses={selectedRoadmap?.semesters.flatMap(s => s.courses) || []}
                    />
                    
                    {showAnalysisResults && analysisResult && (
                      <FlowchartAnalysisReview 
                        isOpen={showAnalysisResults}
                        analysisResult={analysisResult}
                        onClose={() => setShowAnalysisResults(false)}
                        onImport={handleAnalysisImport}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Previous Analyses Section */}
                <PreviousAnalyses onAnalysisImport={handleAnalysisImport} />
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Roadmap Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a roadmap to view its flowchart visualization
                </p>
              </div>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {/* Gallery Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Public Roadmap Gallery</h3>
                <p className="text-sm text-muted-foreground">
                  Discover and import roadmaps shared by other students
                </p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  {/* Search Bar - Left Side */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search roadmaps by name, major, or university..."
                        value={gallerySearchQuery}
                        onChange={(e) => setGallerySearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Filter Controls - Right Side */}
                  <div className="flex flex-wrap gap-3 lg:flex-nowrap">
                    {/* University Search - Hidden on Mobile */}
                    <div className="w-48 hidden md:block">
                      <div className="[&_input]:h-9 [&_input]:text-sm [&_input]:py-1">
                        <UniversitySearch
                          onSelect={(id, name) => {
                            setGalleryFilterUniversity(id);
                            setGalleryFilterUniversityName(name);
                          }}
                          placeholder="University"
                          icon={GraduationCap}
                          iconSize="h-4 w-4"
                        />
                      </div>
                    </div>
                    
                    <Select value={galleryFilterGpaMin} onValueChange={setGalleryFilterGpaMin}>
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Any GPA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any GPA</SelectItem>
                        <SelectItem value="2.0">2.0+</SelectItem>
                        <SelectItem value="2.5">2.5+</SelectItem>
                        <SelectItem value="3.0">3.0+</SelectItem>
                        <SelectItem value="3.5">3.5+</SelectItem>
                        <SelectItem value="3.8">3.8+</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={galleryFilterGradYear} onValueChange={setGalleryFilterGradYear}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Graduation Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                        <SelectItem value="2028">2028</SelectItem>
                        <SelectItem value="2029">2029</SelectItem>
                        <SelectItem value="2030">2030</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Roadmaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingPublicRoadmaps ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : publicRoadmaps.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Public Roadmaps Found</h3>
                  <p className="text-muted-foreground">
                    Be the first to share your roadmap with the community!
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredRoadmaps = publicRoadmaps.filter(roadmap => {
                    const matchesSearch = gallerySearchQuery === "" || 
                      roadmap.name.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
                      roadmap.major.toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
                      roadmap.university.toLowerCase().includes(gallerySearchQuery.toLowerCase());
                    
                    const matchesUniversity = !galleryFilterUniversity || 
                      roadmap.university.toLowerCase().includes(galleryFilterUniversityName.toLowerCase());
                    
                    const matchesGpaMin = galleryFilterGpaMin === "any" || !galleryFilterGpaMin || 
                      (roadmap.showGpa && roadmap.gpa >= parseFloat(galleryFilterGpaMin));
                    
                    const matchesGradYear = galleryFilterGradYear === "all" || 
                      roadmap.expectedGraduation.includes(galleryFilterGradYear);
                    
                    return matchesSearch && matchesUniversity && matchesGpaMin && matchesGradYear;
                  });

                  if (filteredRoadmaps.length === 0) {
                    return (
                      <div className="col-span-full text-center py-12">
                        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No Roadmaps Match Your Search</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search terms or filters to find more roadmaps.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setGallerySearchQuery("");
                              setGalleryFilterUniversity("");
                              setGalleryFilterUniversityName("");
                              setGalleryFilterGpaMin("any");
                              setGalleryFilterGradYear("all");
                            }}
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return filteredRoadmaps.map((roadmap) => (
                    <Card key={roadmap.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base">{roadmap.name}</CardTitle>
                        <CardDescription>
                          {roadmap.major} • {roadmap.university}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Credits:</span>
                            <span className="font-medium">{roadmap.totalCredits}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">GPA:</span>
                            <span className="font-medium">
                              {roadmap.showGpa ? roadmap.gpa.toFixed(2) : "Private"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Semesters:</span>
                            <span className="font-medium">{roadmap.semesters.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Courses:</span>
                            <span className="font-medium">
                              {roadmap.semesters.reduce((total, semester) => total + semester.courses.length, 0)}
                            </span>
                          </div>
                          <div className="pt-2 space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                if (isAppilixEnv) {
                                  // Open in same tab for Appilix or development environment
                                  window.location.href = `/roadmap/${roadmap.id}`;
                                } else {
                                  // Open in new tab for regular web browsers
                                  window.open(`/roadmap/${roadmap.id}`, '_blank');
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleImportPublicRoadmap(roadmap.id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {selectedRoadmap ? (
              <div className="space-y-6">
                {/* Overview Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Academic Overview
                    </CardTitle>
                    <CardDescription>
                      Key statistics about your degree progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedRoadmap.semesters.length}</div>
                        <div className="text-sm text-muted-foreground">Semesters</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {selectedRoadmap.semesters.reduce((total, semester) => total + semester.courses.length, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Courses</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedRoadmap.semesters.reduce((total, semester) => 
                            total + semester.courses.filter(c => c.status === 'completed').length, 0
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed Courses</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedRoadmap.semesters.reduce((total, semester) => 
                            total + semester.courses.filter(c => c.status === 'in-progress').length, 0
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Course Status Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { 
                            status: 'completed', 
                            label: 'Completed', 
                            color: 'bg-green-500',
                            count: selectedRoadmap.semesters.reduce((total, semester) => 
                              total + semester.courses.filter(c => c.status === 'completed').length, 0
                            )
                          },
                          { 
                            status: 'in-progress', 
                            label: 'In Progress', 
                            color: 'bg-blue-500',
                            count: selectedRoadmap.semesters.reduce((total, semester) => 
                              total + semester.courses.filter(c => c.status === 'in-progress').length, 0
                            )
                          },
                          { 
                            status: 'planned', 
                            label: 'Planned', 
                            color: 'bg-gray-500',
                            count: selectedRoadmap.semesters.reduce((total, semester) => 
                              total + semester.courses.filter(c => c.status === 'planned').length, 0
                            )
                          },
                          { 
                            status: 'failed', 
                            label: 'Failed', 
                            color: 'bg-red-500',
                            count: selectedRoadmap.semesters.reduce((total, semester) => 
                              total + semester.courses.filter(c => c.status === 'failed').length, 0
                            )
                          }
                        ].map((item) => {
                          const totalCourses = selectedRoadmap.semesters.reduce((total, semester) => total + semester.courses.length, 0);
                          const percentage = totalCourses > 0 ? (item.count / totalCourses) * 100 : 0;
                          
                          return (
                            <div key={item.status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                <span className="text-sm font-medium">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{item.count}</span>
                                <div className="w-16 bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${item.color}`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {percentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Grade Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(() => {
                          const completedCourses = selectedRoadmap.semesters
                            .flatMap(s => s.courses)
                            .filter(c => c.status === 'completed' && c.grade);
                          
                          const gradeGroups = completedCourses.reduce((acc, course) => {
                            const grade = course.grade!;
                            const gradeGroup = grade.startsWith('A') ? 'A' : 
                                             grade.startsWith('B') ? 'B' : 
                                             grade.startsWith('C') ? 'C' : 
                                             grade.startsWith('D') ? 'D' : 'F';
                            acc[gradeGroup] = (acc[gradeGroup] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>);

                          const gradeColors = {
                            'A': 'bg-green-500',
                            'B': 'bg-blue-500', 
                            'C': 'bg-yellow-500',
                            'D': 'bg-orange-500',
                            'F': 'bg-red-500'
                          };

                          return Object.entries(gradeGroups).map(([grade, count]) => {
                            const percentage = completedCourses.length > 0 ? (count / completedCourses.length) * 100 : 0;
                            
                            return (
                              <div key={grade} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${gradeColors[grade as keyof typeof gradeColors]}`}></div>
                                  <span className="text-sm font-medium">{grade} Grades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">{count}</span>
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${gradeColors[grade as keyof typeof gradeColors]}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10 text-right">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {selectedRoadmap.semesters.flatMap(s => s.courses).filter(c => c.status === 'completed' && c.grade).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No completed courses with grades yet
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Semester Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Semester Progress
                    </CardTitle>
                    <CardDescription>
                      Track your progress across each semester
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRoadmap.semesters.map((semester) => {
                        const completedCourses = semester.courses.filter(c => c.status === 'completed').length;
                        const totalCourses = semester.courses.length;
                        const progressPercentage = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
                        
                        return (
                          <div key={semester.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{semester.name}</h4>
                                <span className="text-sm text-muted-foreground">
                                  {completedCourses}/{totalCourses} courses
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={progressPercentage} className="flex-1 h-2" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {progressPercentage.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Difficulty Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Course Difficulty Analysis
                    </CardTitle>
                    <CardDescription>
                      Average difficulty of your courses by status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { status: 'completed', label: 'Completed', color: 'text-green-600' },
                        { status: 'in-progress', label: 'In Progress', color: 'text-blue-600' },
                        { status: 'planned', label: 'Planned', color: 'text-gray-600' }
                      ].map((item) => {
                        const courses = selectedRoadmap.semesters
                          .flatMap(s => s.courses)
                          .filter(c => c.status === item.status && c.difficulty);
                        
                        const avgDifficulty = courses.length > 0 
                          ? courses.reduce((sum, c) => sum + (c.difficulty || 0), 0) / courses.length 
                          : 0;

                        return (
                          <div key={item.status} className="text-center p-4 bg-muted/30 rounded-lg">
                            <div className={`text-2xl font-bold ${item.color}`}>
                              {avgDifficulty.toFixed(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">{item.label}</div>
                            <div className="flex justify-center mt-1">
                              <DifficultyStars difficulty={Math.round(avgDifficulty)} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Roadmap Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a roadmap to view detailed analytics
                </p>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {selectedRoadmap ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Roadmap Information</CardTitle>
                        <CardDescription>
                          Basic information about your degree roadmap
                        </CardDescription>
                      </div>
                      {!isEditingSettings && (
                        <Button onClick={handleEditSettings}>
                          <Edit className="h-4 w-4 mr-2" />
                          <span className="hidden md:inline">Edit Settings</span>
                          <span className="md:hidden">Edit</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Global error message */}
                    {settingsErrors.submit && (
                      <div className="bg-red-500/20 font-medium px-4 py-2 rounded-md text-sm border border-red-200 dark:border-red-800">
                        {settingsErrors.submit}
                      </div>
                    )}

                    {isEditingSettings ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="roadmap-name">Name</Label>
                            <Input
                              id="roadmap-name"
                              value={settingsFormData.name}
                              onChange={(e) => {
                                setSettingsFormData(prev => ({ ...prev, name: e.target.value }));
                                // Clear error when user starts typing
                                if (settingsErrors.name) {
                                  setSettingsErrors(prev => ({ ...prev, name: "" }));
                                }
                              }}
                              placeholder="Roadmap name"
                              className={settingsErrors.name ? "border-red-500" : ""}
                              autoFocus={false}
                            />
                            {settingsErrors.name && (
                              <p className="text-sm text-red-500 mt-1">{settingsErrors.name}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="roadmap-credits">Total Credits</Label>
                            <Input
                              id="roadmap-credits"
                              type="number"
                              min="30"
                              max="200"
                              value={settingsFormData.totalCredits === 0 ? "" : settingsFormData.totalCredits}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numeric input
                                if (value === "" || /^\d+$/.test(value)) {
                                  if (value === "") {
                                    setSettingsFormData(prev => ({ ...prev, totalCredits: 0 }));
                                  } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue)) {
                                      setSettingsFormData(prev => ({ ...prev, totalCredits: numValue }));
                                    }
                                  }
                                  // Clear error when user starts typing
                                  if (settingsErrors.totalCredits) {
                                    setSettingsErrors(prev => ({ ...prev, totalCredits: "" }));
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                // Prevent non-numeric characters except backspace, delete, tab, escape, enter, and arrow keys
                                if (
                                  !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
                                  !/[0-9]/.test(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              placeholder="120"
                              className={settingsErrors.totalCredits ? "border-red-500" : ""}
                              autoFocus={false}
                            />
                            {settingsErrors.totalCredits && (
                              <p className="text-sm text-red-500 mt-1">{settingsErrors.totalCredits}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="roadmap-major">Major</Label>
                            <Input
                              id="roadmap-major"
                              value={settingsFormData.major}
                              onChange={(e) => {
                                setSettingsFormData(prev => ({ ...prev, major: e.target.value }));
                                // Clear error when user starts typing
                                if (settingsErrors.major) {
                                  setSettingsErrors(prev => ({ ...prev, major: "" }));
                                }
                              }}
                              placeholder="Your major"
                              className={settingsErrors.major ? "border-red-500" : ""}
                              autoFocus={false}
                            />
                            {settingsErrors.major && (
                              <p className="text-sm text-red-500 mt-1">{settingsErrors.major}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="roadmap-graduation">Expected Graduation</Label>
                            <Input
                              id="roadmap-graduation"
                              value={settingsFormData.expectedGraduation}
                              onChange={(e) => setSettingsFormData(prev => ({ ...prev, expectedGraduation: e.target.value }))}
                              placeholder="e.g., Spring 2026"
                              autoFocus={false}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roadmap-visibility">Visibility</Label>
                          <Select 
                            value={settingsFormData.isPublic ? "public" : "private"} 
                            onValueChange={(value) => setSettingsFormData(prev => ({ ...prev, isPublic: value === "public" }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="public">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-8">
                            <div className="space-y-0.5 flex-1">
                              <Label htmlFor="show-gpa">Show GPA in Public Gallery</Label>
                              <p className="text-xs text-muted-foreground">
                                Allow others to see your GPA when your roadmap is public
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <Switch
                                id="show-gpa"
                                checked={settingsFormData.showGpa}
                                onCheckedChange={(checked) => setSettingsFormData(prev => ({ ...prev, showGpa: checked }))}
                                disabled={!settingsFormData.isPublic}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 pb-2">
                          <Button variant="outline" onClick={handleCancelSettings}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSettings}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm text-muted-foreground">{selectedRoadmap.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Major</Label>
                          <p className="text-sm text-muted-foreground">{selectedRoadmap.major}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">University</Label>
                          <p className="text-sm text-muted-foreground">{selectedRoadmap.university}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Expected Graduation</Label>
                          <p className="text-sm text-muted-foreground">{selectedRoadmap.expectedGraduation}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total Credits</Label>
                          <p className="text-sm text-muted-foreground">{selectedRoadmap.totalCredits}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Visibility</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedRoadmap.isPublic ? 'Public' : 'Private'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Show GPA in Gallery</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedRoadmap.showGpa ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Danger Zone */}
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Permanent actions that cannot be undone
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Delete Roadmap</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this roadmap and all associated courses and semesters
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="w-full md:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Roadmap
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Roadmap Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a roadmap to view its settings
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Course Edit Dialog */}
        <Dialog open={isEditingCourse} onOpenChange={setIsEditingCourse}>
          <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                {selectedCourse ? 'Edit Course' : 'Add Course'}
              </DialogTitle>
              <DialogDescription>
                {selectedCourse 
                  ? 'Update course information and progress'
                  : 'Add a new course to your roadmap'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="course-code">Course Code</Label>
                    <span className="text-xs text-muted-foreground">{courseFormData.code.length}/{courseCharLimits.code}</span>
                  </div>
                  <Input
                    id="course-code"
                    placeholder="e.g., COP3502"
                    value={courseFormData.code}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      if (value.length <= courseCharLimits.code) {
                        setCourseFormData(prev => ({ ...prev, code: value }));
                        // Clear error when user starts typing
                        if (courseFormErrors.code) {
                          setCourseFormErrors(prev => ({ ...prev, code: "" }));
                        }
                      }
                    }}
                    maxLength={courseCharLimits.code}
                    className={courseFormErrors.code ? "border-red-500" : ""}
                    autoFocus={false}
                  />
                  {courseFormErrors.code && (
                    <p className="text-sm text-red-500">{courseFormErrors.code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="course-credits">Credits</Label>
                    <span className="text-xs text-muted-foreground invisible">0/0</span>
                  </div>
                  <Input
                    id="course-credits"
                    type="number"
                    placeholder="3"
                    min="0"
                    max="12"
                    value={courseFormData.credits === 0 ? "" : courseFormData.credits}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setCourseFormData(prev => ({ ...prev, credits: 0 }));
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 12) {
                          setCourseFormData(prev => ({ ...prev, credits: numValue }));
                        }
                      }
                    }}
                    autoFocus={false}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="course-name">Course Name</Label>
                  <span className="text-xs text-muted-foreground">{courseFormData.name.length}/{courseCharLimits.name}</span>
                </div>
                <Input
                  id="course-name"
                  placeholder="e.g., Computer Science I"
                  value={courseFormData.name}
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (value.length <= courseCharLimits.name) {
                      setCourseFormData(prev => ({ ...prev, name: value }));
                      // Clear error when user starts typing
                      if (courseFormErrors.name) {
                        setCourseFormErrors(prev => ({ ...prev, name: "" }));
                      }
                      
                      // Check for bad words in real-time
                      if (value.trim()) {
                        const { containsBadWords } = await import('@/utils/badWords');
                        if (await containsBadWords(value)) {
                          setCourseFormErrors(prev => ({ ...prev, name: "Course name contains inappropriate language" }));
                        }
                      }
                    }
                  }}
                  maxLength={courseCharLimits.name}
                  className={courseFormErrors.name ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {courseFormErrors.name && (
                  <p className="text-sm text-red-500">{courseFormErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="course-description">Description</Label>
                  <span className="text-xs text-muted-foreground">{courseFormData.description.length}/{courseCharLimits.description}</span>
                </div>
                <Textarea
                  id="course-description"
                  placeholder="Course description..."
                  value={courseFormData.description}
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (value.length <= courseCharLimits.description) {
                      setCourseFormData(prev => ({ ...prev, description: value }));
                      
                      // Clear error when user starts typing
                      if (courseFormErrors.description) {
                        setCourseFormErrors(prev => ({ ...prev, description: "" }));
                      }
                      
                      // Check for bad words in real-time
                      if (value.trim()) {
                        const { containsBadWords } = await import('@/utils/badWords');
                        if (await containsBadWords(value)) {
                          setCourseFormErrors(prev => ({ ...prev, description: "Description contains inappropriate language" }));
                        }
                      }
                    }
                  }}
                  maxLength={courseCharLimits.description}
                  className={courseFormErrors.description ? "border-red-500" : ""}
                  autoFocus={false}
                />
                {courseFormErrors.description && (
                  <p className="text-sm text-red-500">{courseFormErrors.description}</p>
                )}
              </div>
              <ProfessorSearch
                value={selectedProfessor}
                onChange={setSelectedProfessor}
              />
              <div className="space-y-2">
                <Label htmlFor="course-difficulty">Difficulty Rating</Label>
                <Select 
                  value={courseFormData.difficulty.toString()} 
                  onValueChange={(value) => setCourseFormData(prev => ({ ...prev, difficulty: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">⭐ Very Easy</SelectItem>
                    <SelectItem value="2">⭐⭐ Easy</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Moderate</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Hard</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Very Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-status">Status</Label>
                  <Select 
                    value={courseFormData.status} 
                    onValueChange={(value) => setCourseFormData(prev => ({ ...prev, status: value as Course['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-grade">Grade</Label>
                  <Select 
                    value={courseFormData.grade || "none"} 
                    onValueChange={(value) => setCourseFormData(prev => ({ ...prev, grade: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grade</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="C+">C+</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C-">C-</SelectItem>
                      <SelectItem value="D+">D+</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D-">D-</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="W">W (Withdrawn)</SelectItem>
                      <SelectItem value="I">I (Incomplete)</SelectItem>
                      <SelectItem value="P">P (Pass)</SelectItem>
                      <SelectItem value="NP">NP (No Pass)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 pb-2">
              <Button variant="outline" onClick={() => setIsEditingCourse(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCourse}>
                {selectedCourse ? 'Update' : 'Add'} Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Roadmap Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Delete Roadmap</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedRoadmap?.name}"? This action cannot be undone and will permanently remove all courses and semesters.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 pb-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRoadmap}
                disabled={isDeletingRoadmap}
              >
                {isDeletingRoadmap ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Roadmap
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Semester Dialog */}
        <Dialog open={isAddingSemester} onOpenChange={setIsAddingSemester}>
          <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Add Semester</DialogTitle>
              <DialogDescription>
                Add a new semester to your degree roadmap
              </DialogDescription>
            </DialogHeader>
            <div className="px-1">
              <AddSemesterForm 
                onSave={handleSaveSemester}
                onCancel={() => setIsAddingSemester(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
      </div>
    </ClientSubscriptionCheck>
  );
} 