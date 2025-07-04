"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import DynamicPageTitle from "@/components/dynamic-page-title";
import PaginationControlWrapper from "@/components/pagination-control-wrapper";
import StyledSearchBarWrapper from "@/components/styled-search-bar-wrapper";
import TextbookStats from "@/components/textbook-stats";

// Utility function to format author names
function formatAuthorName(author: string | null | undefined): string {
  if (!author) return "Unknown Author";

  // Add spaces after commas if they don't exist
  return author.replace(/,(?=[^\s])/g, ", ");
}
import {
  BookMarked,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Loader2,
  ZoomIn,
  Download,
} from "lucide-react";
import { fetchYandexDiskImageUrl } from "@/utils/yandex-disk";
import TextbookCoverImage from "@/components/textbook-cover-image";
import { Button } from "@/components/ui/button";
import { isAppilixOrDevelopment } from "@/utils/appilix-detection";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomSelectContent } from "@/components/custom-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientSubscriptionCheck } from "@/components/client-subscription-check";



// Force dynamic rendering to handle search params
export const dynamic = "force-dynamic";

// Component that safely reads search params
function SearchParamsReader({
  onParamsChange,
}: {
  onParamsChange: (params: URLSearchParams) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      onParamsChange(searchParams);
    }
  }, [searchParams, onParamsChange]);

  return null;
}

// TextbookSearch component
function TextbookSearch() {
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";

  return (
    <div className="w-full mb-2">
      <StyledSearchBarWrapper
        placeholder="Search by title, author, or ISBN..."
        defaultValue={currentSearch}
        baseUrl="/dashboard/tools/textbook-answers"
      />
    </div>
  );
}

// TextbookList component
function TextbookList({
  textbooks,
  loading,
  onSelectTextbook,
}: {
  textbooks: any[];
  loading: boolean;
  onSelectTextbook: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-[100px] w-[80px] rounded-md" />
              <Skeleton className="h-6 w-3/4 mt-4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardFooter className="pt-2">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (textbooks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No textbooks found. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {textbooks.map((textbook) => (
        <Card key={textbook.id} className="overflow-hidden flex flex-col h-full">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-4">
              <TextbookCoverImage
                isbn={textbook.isbn}
                title={textbook.title}
                primaryImageUrl={textbook.image_url}
                className="h-[120px] w-[90px]"
              />
              <div className="flex-1">
                <CardTitle className="text-base line-clamp-2">{textbook.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {formatAuthorName(textbook.author)}
                </CardDescription>
                <p className="text-xs text-muted-foreground mt-1">ISBN: {textbook.isbn}</p>
              </div>
            </div>
          </CardHeader>
          <CardFooter className="pt-2 mt-auto">
            <Button
              className="w-full"
              onClick={() => onSelectTextbook(textbook.id)}
            >
              View Solutions
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// TextbookDetail component
function TextbookDetail({
  textbookId,
  onBack,
}: {
  textbookId: string;
  onBack: () => void;
}) {
  const [textbook, setTextbook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [solutionImageUrl, setSolutionImageUrl] = useState<string | null>(null);
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAppilix, setIsAppilix] = useState(false);

  // Check if we're in Appilix or development environment
  useEffect(() => {
    // This needs to run in the browser
    if (typeof window !== 'undefined') {
      setIsAppilix(isAppilixOrDevelopment());
    }
  }, []);

  useEffect(() => {
    async function fetchTextbookDetails() {
      setLoading(true);

      try {
        // Use the API route instead of direct Supabase queries
        const response = await fetch(`/api/tools/textbooks/${textbookId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.textbook) {
          setTextbook(null);
          setChapters([]);
          setLoading(false);
          return;
        }

        setTextbook(data.textbook);

        // Sort chapters numerically
        const sortedChapters = [...(data.chapters || [])].sort((a, b) => {
          // Convert chapter numbers to comparable values
          const aNum = parseFloat(a.chapter_number.replace(/[^0-9.]/g, '')) || 0;
          const bNum = parseFloat(b.chapter_number.replace(/[^0-9.]/g, '')) || 0;
          return aNum - bNum;
        });

        setChapters(sortedChapters);
        setLoading(false);

        // If chapters exist, select the first one by default
        if (sortedChapters.length > 0) {
          setSelectedChapter(sortedChapters[0].id);
        }
      } catch (error) {
        console.error("Error fetching textbook:", error);
        setTextbook(null);
        setChapters([]);
        setLoading(false);
      }
    }

    fetchTextbookDetails();
  }, [textbookId]);

  useEffect(() => {
    async function fetchProblems() {
      if (!selectedChapter) return;

      setProblems([]);
      setSelectedProblem(null);
      setSolution(null);

      try {
        const response = await fetch(`/api/tools/textbooks/${selectedChapter}/problems`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const sortedProblems = data.problems || [];

        setProblems(sortedProblems);

        // If problems exist, select the first one by default
        if (sortedProblems.length > 0) {
          setSelectedProblem(sortedProblems[0].id);
        }
      } catch (error) {
        console.error("Error fetching problems:", error);
      }
    }

    fetchProblems();
  }, [selectedChapter]);

  useEffect(() => {
    async function fetchSolution() {
      if (!selectedProblem) return;

      setSolution(null);
      setSolutionImageUrl(null);
      setSolutionLoading(true);

      try {
        const response = await fetch(`/api/tools/textbooks/problems/${selectedProblem}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const problemData = data.problem;

        if (!problemData) {
          setSolutionLoading(false);
          return;
        }

        // Set the original solution URL
        setSolution(problemData.solution_url);

        // Check if it's a Yandex Disk URL
        if (problemData.solution_url && problemData.solution_url.includes('yadi.sk')) {
          // Fetch the image URL from Yandex Disk API using the full URL
          const result = await fetchYandexDiskImageUrl(problemData.solution_url);
          if (result.imageUrl) {
            // Set the image URL in state
            setSolutionImageUrl(result.imageUrl);
          }
        }
      } catch (error) {
        console.error("Error in fetchSolution:", error);
      } finally {
        setSolutionLoading(false);
      }
    }

    fetchSolution();
  }, [selectedProblem]);



  if (loading) {
    return (
      <div className="space-y-4">
        {/* Back button skeleton */}
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={onBack} disabled>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Textbook info skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-[120px] w-[90px] shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6 mt-6">
          {/* Selection controls skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Solution display skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!textbook) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <div className="mb-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Error message */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">Textbook not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Set dynamic page title */}
      <DynamicPageTitle title={`UniShare | ${textbook.title}`} />

      {/* Back button above textbook info */}
      <div className="mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Textbook information */}
      <div className="flex items-start gap-4">
        <TextbookCoverImage
          isbn={textbook.isbn}
          title={textbook.title}
          primaryImageUrl={textbook.image_url}
          className="h-[120px] w-[90px] shrink-0"
        />
        <div>
          <h2 className="text-xl font-semibold">{textbook.title}</h2>
          <p className="text-sm text-muted-foreground">{formatAuthorName(textbook.author)}</p>
          <p className="text-xs text-muted-foreground mt-1">ISBN: {textbook.isbn}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Selection controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chapter selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Chapter</label>
            <Select
              value={selectedChapter || ""}
              onValueChange={setSelectedChapter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a chapter" />
              </SelectTrigger>
              <CustomSelectContent className="max-h-[200px] overflow-y-auto">
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    Chapter {chapter.chapter_number}
                  </SelectItem>
                ))}
              </CustomSelectContent>
            </Select>

            {chapters.length === 0 && (
              <p className="text-sm text-muted-foreground">No chapters available for this textbook.</p>
            )}
          </div>

          {/* Problem selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Problem</label>
            <Select
              value={selectedProblem || ""}
              onValueChange={setSelectedProblem}
              disabled={!selectedChapter || problems.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a problem" />
              </SelectTrigger>
              <CustomSelectContent className="max-h-[200px] overflow-y-auto">
                {problems.map((problem) => (
                  <SelectItem key={problem.id} value={problem.id}>
                    Problem {problem.problem_number}
                  </SelectItem>
                ))}
              </CustomSelectContent>
            </Select>

            {selectedChapter && problems.length === 0 && (
              <p className="text-sm text-muted-foreground">No problems available for this chapter.</p>
            )}
          </div>
        </div>

        {/* Solution display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Solution</label>
          <Card className="min-h-[300px] max-h-[800px] flex flex-col overflow-hidden">
            <CardContent className="flex-1 flex items-center justify-center p-4 relative">
              {!selectedProblem ? (
                <p className="text-muted-foreground">Select a problem to view its solution</p>
              ) : solutionLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading solution...</p>
                </div>
              ) : solutionImageUrl ? (
                <div className="w-full h-full flex flex-col relative">
                  {/* Main container with image - aligned to top */}
                  <div id="solution-image-container" className="image-container w-full h-full max-h-[700px] flex items-start justify-center overflow-auto relative">
                    {/* Image container - also aligned to top */}
                    <div className="w-full h-full flex items-start justify-center pt-2">
                      <img
                        key={solutionImageUrl}
                        src={solutionImageUrl}
                        alt="Solution"
                        className="max-w-full object-contain mt-0 border-0"
                        style={{ maxHeight: 'calc(100% - 20px)', objectPosition: 'top', border: 'none', outline: 'none' }}
                        onLoad={() => {
                          // Function to update UI when image is loaded
                          const updateUI = () => {
                            const imageContainer = document.querySelector('.image-container');
                            const loader = document.getElementById('solution-loader');
                            const buttonsContainer = document.getElementById('buttons-container');
                            const img = document.querySelector('.image-container img');
                            const solutionCard = document.querySelector('.image-container')?.closest('.card');

                            // If we have the image container and the image, we can proceed
                            if (imageContainer && img && buttonsContainer) {
                              // Always hide loader and show buttons once image has loaded
                              if (loader) (loader as HTMLElement).style.display = 'none';

                              // Show the buttons
                              (buttonsContainer as HTMLElement).style.display = 'flex';

                              // Dynamically adjust container height for mobile
                              setTimeout(() => {
                                // Get the image height
                                const imgHeight = (img as HTMLImageElement).height;
                                // Get the buttons container height (including margin)
                                const buttonsHeight = buttonsContainer.offsetHeight + 16; // 16px for margin (mt-4)

                                // Calculate total needed height (image + buttons + padding)
                                const totalContentHeight = imgHeight + buttonsHeight + 16; // 16px for padding

                                // If on mobile and content is smaller than min-height
                                if (window.innerWidth < 768 && totalContentHeight < 600) {
                                  // Set the container to fit content instead of min-height
                                  if (solutionCard) {
                                    // Add some buffer space
                                    (solutionCard as HTMLElement).style.minHeight = `${totalContentHeight + 40}px`;
                                  }

                                  // Also adjust the image container
                                  if (imageContainer) {
                                    (imageContainer as HTMLElement).style.height = 'auto';
                                  }
                                }
                              }, 100);
                            } else {
                              // Try again in a moment if elements aren't ready
                              setTimeout(updateUI, 100);
                            }
                          };

                          // Start checking after a short delay to ensure DOM is ready
                          setTimeout(() => {
                            // First scroll the container to the top
                            const imageContainer = document.querySelector('.image-container');
                            if (imageContainer) {
                              // Scroll to the top of the container
                              imageContainer.scrollTop = 0;
                            }

                            // Then update UI
                            updateUI();
                          }, 200);
                        }}
                      />
                    </div>
                  </div>

                  {/* Buttons container with loader */}
                  <div className="mt-4 flex flex-col items-center gap-4 relative">
                    {/* Full-height loader container */}
                    <div id="solution-loader" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>

                    {/* Buttons container - initially hidden but will be shown by JavaScript */}
                    <div id="buttons-container" style={{ display: 'none' }} className="w-full flex justify-center gap-4 relative z-10">
                      {/* Only show View Full Size button if not in Appilix or development environment */}
                      {!isAppilix && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={solutionImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ZoomIn className="h-4 w-4 mr-2" />
                            View Full Size
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={solutionImageUrl}
                          download={`${textbook?.isbn || ''}_Ch${chapters.find(c => c.id === selectedChapter)?.chapter_number || ''}_Prob${problems.find(p => p.id === selectedProblem)?.problem_number || ''}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : solution ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <p className="text-muted-foreground mb-4">
                    This solution is available at an external link:
                  </p>
                  <Button asChild>
                    <a href={solution} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Solution
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">No solution available for this problem.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function TextbookAnswersPage() {
  const searchParams = useSearchParams();
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [totalTextbooks, setTotalTextbooks] = useState(0);
  const router = useRouter();

  // Pagination parameters
  const pageSize = 6; // Number of textbooks per page
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const handleParamsChange = (params: URLSearchParams) => {
    const textbookId = params.get("textbook");
    // Update the state based on the URL parameter
    // If textbookId is null, it means we're back on the main page
    setSelectedTextbookId(textbookId);
  };

  const handleSearch = async (query: string) => {
    // Clear any existing timeouts
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }

    // Set a timeout to show loading state only if search takes longer than 300ms
    const newLoadingTimeout = setTimeout(() => {
      setLoading(true);
    }, 300);
    setLoadingTimeout(newLoadingTimeout);

    // Debounce the search to prevent rapid flickering
    const newSearchTimeout = setTimeout(async () => {
      try {
        // Use the API route instead of direct Supabase queries
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
        });

        if (query) {
          params.append('query', query);
        }

        const apiUrl = `/api/tools/textbooks?${params}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTextbooks(data.textbooks || []);
        setTotalTextbooks(data.total || 0);
      } catch (error) {
        console.error("Error in search:", error);
        setTextbooks([]);
        setTotalTextbooks(0);
      } finally {
        // Clear the loading timeout if it hasn't fired yet
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          setLoadingTimeout(null);
        }

        setLoading(false);
        setSearchTimeout(null);
      }
    }, 400); // Slightly longer than the loading timeout

    setSearchTimeout(newSearchTimeout);
  };

  // Use a ref to track if initial load has been done
  const initialLoadDoneRef = useRef(false);

  // Store the current search query
  const currentSearchQuery = searchParams.get("search") || "";

  // React to page or search changes
  useEffect(() => {
    // Fetch textbooks when page or search changes
    handleSearch(currentSearchQuery);
  }, [currentPage, currentSearchQuery]);

  // Initial load effect
  useEffect(() => {
    // Only load initial textbooks if it hasn't been done yet
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;

      // No need for additional initial load since the page/search effect will handle it
    }
  }, []);

  const handleSelectTextbook = (id: string) => {
    setSelectedTextbookId(id);
    router.push(`/dashboard/tools/textbook-answers?textbook=${id}`);
  };

  const handleBack = () => {
    // Just update the URL - the state will be updated via the SearchParamsReader
    router.push("/dashboard/tools/textbook-answers");
  };

  return (
    <ClientSubscriptionCheck redirectTo="/pricing">
      <div className="container mx-auto px-4 py-8 pb-15 md:pb-8 flex flex-col gap-8">
        {/* Set default page title when no textbook is selected */}
        {!selectedTextbookId && (
          <DynamicPageTitle title="UniShare | Textbook Answers" />
        )}

        <header className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookMarked className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Textbook Answers</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Find step-by-step solutions to popular textbooks
              </p>
            </div>
          </div>
          <div className="w-full">
            <TextbookSearch />
          </div>
        </header>

        {/* Safely read search params with Suspense */}
        <Suspense fallback={null}>
          <SearchParamsReader onParamsChange={handleParamsChange} />
        </Suspense>

        {selectedTextbookId ? (
          <TextbookDetail textbookId={selectedTextbookId} onBack={handleBack} />
        ) : (
          <>
            {/* Statistics section */}
            <TextbookStats className="mb-6" loading={loading} />

            <TextbookList
              textbooks={textbooks}
              loading={loading}
              onSelectTextbook={handleSelectTextbook}
            />

            {/* Pagination control */}
            {!loading && textbooks.length > 0 && (
              <div className="mt-4 md:mt-8">
                <PaginationControlWrapper
                  currentPage={currentPage}
                  totalItems={totalTextbooks}
                  pageSize={pageSize}
                  baseUrl="/dashboard/tools/textbook-answers"
                  preserveParams={true}
                />
              </div>
            )}
          </>
        )}
      </div>
    </ClientSubscriptionCheck>
  );
}
