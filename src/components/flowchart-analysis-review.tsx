"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogFooterNoBorder, DialogHeader, DialogHeaderNoBorder, DialogTitle, DialogScrollableContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CheckCircle, AlertCircle, Clock, BookOpen, TrendingUp, Users, Calendar, Target, Lightbulb, XCircle, Download, FileText, GraduationCap } from 'lucide-react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import MobileTabs from '@/components/mobile-tabs';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeaderNoBorder>
            <DialogTitle className="flex items-center justify-center sm:justify-start gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Analysis Failed
            </DialogTitle>
            <DialogDescription>
              There was an issue analyzing your flowchart.
            </DialogDescription>
          </DialogHeaderNoBorder>
          
          <div className="px-6 py-4">
            <div className="p-4 bg-orange-600/10 border border-orange-300 rounded-lg">
              <p className="text-foreground">{analysisResult.error}</p>
            </div>
          </div>
          
          <DialogFooterNoBorder>
            <Button onClick={onClose}>Close</Button>
          </DialogFooterNoBorder>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center sm:justify-start gap-2">
            <Brain className="h-5 w-5" />
            Analysis Results
          </DialogTitle>
          <DialogDescription>
            Review the analyzed courses and select which ones to import into your roadmap
          </DialogDescription>
        </DialogHeader>

        <DialogScrollableContent>
          {analysisResult.error ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
              <p className="text-muted-foreground">{analysisResult.error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analysis Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Analysis Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 border rounded-lg">
                      <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-primary">{analysisResult.insights.totalCoursesFound}</div>
                      <div className="text-sm text-muted-foreground">Total Courses</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">{analysisResult.insights.completedCourses}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">{analysisResult.insights.remainingCourses}</div>
                      <div className="text-sm text-muted-foreground">Remaining</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-xl font-bold text-blue-600">{analysisResult.insights.estimatedGraduationDate}</div>
                      <div className="text-sm text-muted-foreground">Est. Graduation</div>
                    </div>
                  </div>
                  
                  {analysisResult.insights.recommendations.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {analysisResult.insights.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Suggested Academic Paths */}
              {analysisResult.suggestedPaths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Suggested Academic Paths
                    </CardTitle>
                    <CardDescription>
                      Choose a recommended path based on your current progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.suggestedPaths.map((path, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedPath?.name === path.name
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPath(selectedPath?.name === path.name ? null : path)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{path.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {path.duration}
                                </Badge>
                                {path.totalCredits && (
                                  <Badge variant="outline" className="text-xs">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    {path.totalCredits} credits
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              checked={selectedPath?.name === path.name}
                              onChange={() => {}}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Course Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Detected Courses
                  </CardTitle>
                  <CardDescription>
                    Select courses to import into your roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Selection Buttons */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll('completed')}
                        className="text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 sm:mr-2" />
                        <span className="sm:inline hidden">Select&nbsp;</span>Completed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll('missing')}
                        className="text-xs sm:text-sm"
                      >
                        <AlertCircle className="h-3 w-3 mr-1 sm:mr-2" />
                        <span className="sm:inline hidden">Select&nbsp;</span>Missing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll('suggested')}
                        className="text-xs sm:text-sm"
                      >
                        <Clock className="h-3 w-3 mr-1 sm:mr-2" />
                        <span className="sm:inline hidden">Select&nbsp;</span>Suggested
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearSelection}
                        className="text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 mr-1 sm:mr-2" />
                        Clear All
                      </Button>
                    </div>

                    <Separator />

                    {/* Course List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {analysisResult.courses.map((course, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-start space-x-3 sm:flex-1">
                            <Checkbox
                              checked={selectedCourses.has(course.code)}
                              onCheckedChange={(checked) => handleCourseToggle(course.code)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-sm sm:text-base">{course.code}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant={course.status === 'completed' ? 'default' : course.status === 'missing' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {getStatusIcon(course.status)}
                                    <span className="ml-1">{course.status}</span>
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-muted-foreground">
                                    {course.credits} credits
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {course.name}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                                {course.semester && (
                                  <div className="text-xs text-muted-foreground">
                                    Suggested: {course.semester}
                                  </div>
                                )}
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Prerequisites: {course.prerequisites.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end sm:block sm:text-right sm:ml-auto sm:mt-0">
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs sm:hidden">
                                {Math.round(course.confidence * 100)}%
                              </Badge>
                              <div className="hidden sm:block text-xs sm:text-sm font-medium">
                                {Math.round(course.confidence * 100)}% confidence
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogScrollableContent>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedCourses.size === 0 || !!analysisResult.error}
          >
            <Download className="h-4 w-4 mr-2" />
            Import Selected ({selectedCourses.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 