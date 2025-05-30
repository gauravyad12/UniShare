import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CheckCircle, AlertCircle, Clock, BookOpen, TrendingUp, Users, Calendar, Target, Lightbulb } from 'lucide-react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import MobileTabs from '@/components/mobile-tabs';

interface AnalyzedCourse {
  code: string;
  name: string;
  credits: number;
  semester: string;
  status: 'completed' | 'missing' | 'suggested';
  confidence: number;
  prerequisites?: string[];
}

interface SuggestedPath {
  name: string;
  description: string;
  courses: string[];
  duration: string;
  totalCredits?: number;
}

interface AnalysisInsights {
  totalCoursesFound: number;
  completedCourses: number;
  remainingCourses: number;
  estimatedGraduationDate: string;
  recommendations: string[];
}

interface AnalysisResult {
  courses: AnalyzedCourse[];
  suggestedPaths: SuggestedPath[];
  insights: AnalysisInsights;
  error?: string;
}

interface FlowchartAnalysisReviewProps {
  isOpen: boolean;
  analysisResult: AnalysisResult;
  onClose: () => void;
  onImport: (selectedCourses: AnalyzedCourse[], selectedPath?: SuggestedPath) => void;
}

export default function FlowchartAnalysisReview({ 
  isOpen, 
  analysisResult, 
  onClose, 
  onImport 
}: FlowchartAnalysisReviewProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<SuggestedPath | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useMobileDetection();

  const handleCourseToggle = (courseCode: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseCode)) {
      newSelected.delete(courseCode);
    } else {
      newSelected.add(courseCode);
    }
    setSelectedCourses(newSelected);
  };

  const handleSelectAll = (status: string) => {
    const coursesToSelect = analysisResult.courses
      .filter(course => status === 'all' || course.status === status)
      .map(course => course.code);
    
    setSelectedCourses(new Set([...Array.from(selectedCourses), ...coursesToSelect]));
  };

  const handleClearSelection = () => {
    setSelectedCourses(new Set());
  };

  const handleImport = () => {
    const coursesToImport = analysisResult.courses.filter(course => 
      selectedCourses.has(course.code)
    );
    onImport(coursesToImport, selectedPath || undefined);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'suggested': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'missing': return <AlertCircle className="h-4 w-4" />;
      case 'suggested': return <Clock className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (analysisResult.error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Analysis Failed
            </DialogTitle>
            <DialogDescription>
              There was an issue analyzing your flowchart.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-orange-600/10 border border-orange-300 rounded-lg">
            <p className="text-foreground">{analysisResult.error}</p>
          </div>
          
          <DialogFooter className="md:pt-6">
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 justify-center sm:justify-start">
            <Brain className="h-5 w-5 text-blue-500" />
            Flowchart Analysis Results
          </DialogTitle>
          <DialogDescription className="text-center sm:text-left">
            Review the AI analysis of your degree flowchart and select what to import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 sm:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tabs - only show on mobile */}
            {isMobile && (
              <MobileTabs
                tabs={[
                  { value: "overview", label: "Overview" },
                  { value: "courses", label: `Courses (${analysisResult.courses.length})` },
                  { value: "paths", label: `Paths (${analysisResult.suggestedPaths.length})` },
                  { value: "insights", label: "Insights" }
                ]}
                activeTab={activeTab}
                className="mb-6"
                onTabChange={setActiveTab}
              />
            )}

            {/* Desktop Tabs - only show on desktop */}
            {!isMobile && (
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">Courses ({analysisResult.courses.length})</TabsTrigger>
                <TabsTrigger value="paths">Pathways ({analysisResult.suggestedPaths.length})</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Total Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysisResult.insights.totalCoursesFound}</div>
                    <p className="text-xs text-muted-foreground">Found in flowchart</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{analysisResult.insights.completedCourses}</div>
                    <p className="text-xs text-muted-foreground">Already taken</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Remaining
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.insights.remainingCourses}</div>
                    <p className="text-xs text-muted-foreground">Still needed</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Graduation Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{analysisResult.insights.estimatedGraduationDate}</p>
                  <p className="text-sm text-muted-foreground">Estimated graduation date based on remaining courses</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" variant="outline" onClick={() => handleSelectAll('all')}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSelectAll('missing')}>
                  Select Missing
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSelectAll('suggested')}>
                  Select Suggested
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearSelection}>
                  Clear Selection
                </Button>
              </div>

              <div className="grid gap-2 sm:gap-3 max-h-96 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 w-full">
                {analysisResult.courses.map((course) => (
                  <Card key={course.code} className="p-2 sm:p-4 w-full max-w-full overflow-hidden">
                    <div className="flex flex-col gap-2 w-full overflow-hidden">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1 overflow-hidden">
                        <Checkbox
                          checked={selectedCourses.has(course.code)}
                          onCheckedChange={() => handleCourseToggle(course.code)}
                          className="flex-shrink-0 mt-1 professor-filter-checkbox"
                        />
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                          <div className="flex-shrink-0">
                            {getStatusIcon(course.status)}
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="font-medium text-sm sm:text-base truncate">{course.code}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{course.name}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 justify-start sm:justify-end">
                        <Badge variant="secondary" className="text-xs">{course.credits} cr</Badge>
                        <Badge className={`${getStatusColor(course.status)} text-xs`}>
                          {course.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(course.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground truncate w-full overflow-hidden">
                        Prerequisites: {course.prerequisites.join(', ')}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paths" className="space-y-4">
              <div className="grid gap-4">
                {analysisResult.suggestedPaths.map((path, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-colors ${
                      selectedPath?.name === path.name ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => setSelectedPath(selectedPath?.name === path.name ? null : path)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {path.name}
                        </span>
                        <Badge variant="outline">{path.duration}</Badge>
                      </CardTitle>
                      <CardDescription>{path.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {path.courses.map((courseCode) => (
                          <Badge key={courseCode} variant="secondary" className="text-xs">
                            {courseCode}
                          </Badge>
                        ))}
                      </div>
                      {path.totalCredits && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Total Credits: {path.totalCredits}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.insights.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 pt-6">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selectedCourses.size} course(s) selected
              {selectedPath && `, ${selectedPath.name} pathway selected`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={selectedCourses.size === 0}
              >
                Import
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 