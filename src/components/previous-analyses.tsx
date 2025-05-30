import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  History, 
  Eye, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Calendar, 
  FileImage, 
  Lightbulb,
  BookOpen,
  CheckCircle,
  Target,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FlowchartAnalysisReview from '@/components/flowchart-analysis-review';

interface AnalysisRecord {
  id: string;
  original_filename: string;
  analysis_result: any;
  created_at: string;
  user_id: string;
}

interface PreviousAnalysesProps {
  onAnalysisImport?: (selectedCourses: any[], selectedPath?: any) => void;
}

export default function PreviousAnalyses({ onAnalysisImport }: PreviousAnalysesProps) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (analysisId: string) => {
    setExpandedAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flowchart/analyses');
      const data = await response.json();
      
      if (response.ok) {
        setAnalyses(data.analyses || []);
      } else {
        console.error('Error fetching analyses:', data.error);
        toast({
          title: "Error",
          description: "Failed to load previous analyses",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load previous analyses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/flowchart/analyses?id=${analysisId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
        toast({
          title: "Success",
          description: "Analysis deleted successfully",
        });
      } else {
        throw new Error('Failed to delete analysis');
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive",
      });
    }
  };

  const handleViewAnalysis = (analysis: AnalysisRecord) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisDialog(true);
  };

  const handleAnalysisImportWrapper = (selectedCourses: any[], selectedPath?: any) => {
    if (onAnalysisImport) {
      onAnalysisImport(selectedCourses, selectedPath);
    }
    setShowAnalysisDialog(false);
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Previous Analyses
          </CardTitle>
          <CardDescription>
            View and manage your previous flowchart analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Previous Analyses
          </CardTitle>
          <CardDescription>
            View and manage your previous flowchart analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyses.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Previous Analyses</h3>
              <p className="text-muted-foreground">
                Upload a flowchart to create your first analysis
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Collapsible className="min-w-0 flex-1">
                          <CollapsibleTrigger
                            onClick={() => toggleExpanded(analysis.id)}
                            className="flex items-center gap-2 hover:text-blue-600 min-w-0 w-full text-left"
                          >
                            {expandedAnalyses.has(analysis.id) ? (
                              <ChevronDown className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            )}
                            <FileImage className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium truncate min-w-0 flex-1">
                              {analysis.original_filename}
                            </span>
                          </CollapsibleTrigger>
                        </Collapsible>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAnalysis(analysis)}
                          className="h-8"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>{formatDate(analysis.created_at)}</span>
                    </div>
                  </CardHeader>

                  <Collapsible open={expandedAnalyses.has(analysis.id)}>
                    <CollapsibleContent className="pt-0">
                      <CardContent className="pt-0 px-6 pb-6">
                        {analysis.analysis_result.error ? (
                          <div className="p-4 bg-orange-600/10 border border-orange-300 rounded-lg">
                            <p className="text-foreground">{analysis.analysis_result.error}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <BookOpen className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">Total</span>
                                </div>
                                <div className="text-lg font-bold">{analysis.analysis_result.insights?.totalCoursesFound || 0}</div>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium">Completed</span>
                                </div>
                                <div className="text-lg font-bold text-green-600">{analysis.analysis_result.insights?.completedCourses || 0}</div>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">Remaining</span>
                                </div>
                                <div className="text-lg font-bold text-blue-600">{analysis.analysis_result.insights?.remainingCourses || 0}</div>
                              </div>
                            </div>

                            {/* Recommendations Preview */}
                            {analysis.analysis_result.insights?.recommendations?.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4 flex-shrink-0" />
                                  <span>Key Recommendations</span>
                                </h4>
                                <div className="space-y-2">
                                  {analysis.analysis_result.insights.recommendations.slice(0, 3).map((rec: string, index: number) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                      <p className="text-sm text-muted-foreground break-words">{rec}</p>
                                    </div>
                                  ))}
                                  {analysis.analysis_result.insights.recommendations.length > 3 && (
                                    <p className="text-xs text-muted-foreground italic">
                                      +{analysis.analysis_result.insights.recommendations.length - 3} more recommendations
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Graduation Date */}
                            {analysis.analysis_result.insights?.estimatedGraduationDate && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm font-medium">Expected Graduation:</span>
                                <Badge variant="outline">{analysis.analysis_result.insights.estimatedGraduationDate}</Badge>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results Dialog */}
      {selectedAnalysis && (
        <FlowchartAnalysisReview 
          isOpen={showAnalysisDialog}
          analysisResult={selectedAnalysis.analysis_result}
          onClose={() => {
            setShowAnalysisDialog(false);
            setSelectedAnalysis(null);
          }}
          onImport={handleAnalysisImportWrapper}
        />
      )}
    </>
  );
} 