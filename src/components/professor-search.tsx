"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ChevronsUpDown, X, Star, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchProfessors, formatProfessorWithDepartment, type Professor } from "@/utils/rateMyProfessor";

// Function to get university abbreviation
function getUniversityAbbreviation(universityName: string): string {
  // Common university abbreviations
  const abbreviations: Record<string, string> = {
    "University of Central Florida": "UCF",
    "Florida State University": "FSU",
    "University of Florida": "UF",
    "University of South Florida": "USF",
    "Florida International University": "FIU",
    "University of Miami": "UM",
    "Florida Atlantic University": "FAU",
    "University of North Florida": "UNF",
    "Florida Gulf Coast University": "FGCU",
    "University of West Florida": "UWF",
  };

  // Check if we have a predefined abbreviation
  if (abbreviations[universityName]) {
    return abbreviations[universityName];
  }

  // If not, try to create an abbreviation from capital letters
  const capitals = universityName.match(/\b[A-Z]/g);
  if (capitals && capitals.length >= 2) {
    return capitals.join("");
  }

  // If all else fails, return the first 3-4 characters
  return universityName.substring(0, 4);
}

interface ProfessorSearchProps {
  value: Professor | null;
  onChange: (professor: Professor | null) => void;
  error?: string;
  required?: boolean;
}

export default function ProfessorSearch({
  value,
  onChange,
  error,
  required = false
}: ProfessorSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
  const [filterByUniversity, setFilterByUniversity] = useState(true);
  const [userUniversity, setUserUniversity] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // We'll get the university from the search results instead of a separate API call

  // Prevent autofocus when dialog opens
  useEffect(() => {
    if (open) {
      // Use a timeout to ensure this runs after the dialog's built-in focus handling
      const timer = setTimeout(() => {
        // Blur any focused element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        // Ensure the search input doesn't get focused
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Filter professors based on university filter setting
  useEffect(() => {
    if (filterByUniversity && userUniversity) {
      // Filter professors to only include those from the user's university
      const filtered = allProfessors.filter(professor =>
        professor.school?.name?.toLowerCase().includes(userUniversity.toLowerCase())
      );
      console.log(`Filtered from ${allProfessors.length} to ${filtered.length} professors from ${userUniversity}`);
      setProfessors(filtered);
    } else {
      // Show all professors
      setProfessors(allProfessors);
    }
  }, [allProfessors, filterByUniversity, userUniversity]);

  // Search for professors when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setAllProfessors([]);
      setProfessors([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`Searching for professors with query: "${query}"`);
        const { professors, userUniversity: universityFromSearch } = await searchProfessors(query);
        console.log(`Found ${professors.length} professors matching "${query}"`);

        // Store all results
        setAllProfessors(professors);

        // Set the user's university if we got it from the search
        if (universityFromSearch && !userUniversity) {
          setUserUniversity(universityFromSearch);
          console.log(`User's university set to: ${universityFromSearch}`);
        }

        // Filtering will happen in the other useEffect
      } catch (error) {
        console.error("Error searching professors:", error);
        // Show empty results but don't break the UI
        setAllProfessors([]);
        setProfessors([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSelect = (professor: Professor) => {
    onChange(professor);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor="professor">Professor {required ? "*" : "(optional)"}</Label>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            className={cn(
              "w-full justify-between",
              error ? "border-red-500" : "",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center overflow-hidden">
              {value ? (
                <>
                  <span className="truncate">{formatProfessorWithDepartment(value)}</span>
                  {value.rating && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-2 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px] p-4">
                          <div className="space-y-2">
                            <div className="font-medium">{value.firstName} {value.lastName}</div>
                            {value.department && (
                              <div className="text-sm text-muted-foreground">{value.department}</div>
                            )}
                            {value.school?.name && (
                              <div className="text-sm text-muted-foreground">{value.school.name}</div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                              {value.rating && (
                                <div className="flex items-center">
                                  <Star className="h-3.5 w-3.5 text-yellow-500 mr-1 fill-yellow-500" />
                                  <span>{typeof value.rating === 'number' ? value.rating.toFixed(1) : value.rating}</span>
                                </div>
                              )}
                              {value.numRatings !== undefined && (
                                <div className="text-muted-foreground">
                                  {value.numRatings} {value.numRatings === 1 ? 'rating' : 'ratings'}
                                </div>
                              )}
                            </div>
                            {value.difficulty !== undefined && value.difficulty !== null && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Difficulty:</span> {value.difficulty.toFixed(1)}/5
                              </div>
                            )}
                            {value.wouldTakeAgainPercent !== undefined && value.wouldTakeAgainPercent !== null && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Would take again:</span> {value.wouldTakeAgainPercent}%
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              ) : (
                <div className="flex items-center text-muted-foreground">
                  <Search className="h-4 w-4 mr-2" />
                  Search for a professor...
                </div>
              )}
            </div>
            <div className="flex">
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 mr-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[500px]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div id="professor-search-description" className="sr-only">Search for professors to attach to this resource</div>
          <DialogHeader>
            <DialogTitle>Search for a Professor</DialogTitle>
            <DialogDescription>
              Search by name to find and attach a professor to this resource
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex flex-col space-y-3">
              <Label htmlFor="professor-search" className="text-sm font-medium">Search Professors</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="professor-search"
                  placeholder="Enter professor name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8"
                  autoFocus={false}
                  ref={searchInputRef}
                  tabIndex={-1} /* Prevent tab focus */
                />
              </div>
            </div>
            {userUniversity && (
              <div className="mb-3">
                <div className="flex items-center h-5">
                  <Checkbox
                    id="filter-university"
                    checked={filterByUniversity}
                    onCheckedChange={(checked) => setFilterByUniversity(checked === true)}
                    className="professor-filter-checkbox !h-4 !min-h-0"
                  />
                  <label
                    htmlFor="filter-university"
                    className="text-sm text-muted-foreground cursor-pointer ml-2 whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ maxWidth: "calc(100% - 24px)" }}
                  >
                    {getUniversityAbbreviation(userUniversity)} professors only
                  </label>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-3 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : query.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Enter at least 2 characters to search
                </div>
              ) : professors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No professors found
                </div>
              ) : (
                <div className="space-y-3">
                  {professors.map((professor) => (
                    <div
                      key={professor.id}
                      className="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg border border-muted/40 transition-colors cursor-pointer"
                      onClick={() => handleSelect(professor)}
                    >
                      <div className="flex-shrink-0 mt-1 relative w-4 h-4 rounded-sm border border-primary">
                        {value?.id === professor.id && (
                          <div className="absolute inset-0 bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium cursor-pointer line-clamp-1 block">
                          {professor.firstName} {professor.lastName}
                        </div>
                        {professor.department && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {professor.department}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {professor.school?.name && (
                            <span className="text-xs text-muted-foreground bg-primary/10 px-1.5 py-0.5 rounded-sm">
                              {professor.school.name}
                            </span>
                          )}
                          {professor.rating !== null && professor.rating !== undefined && (
                            <span className="text-xs text-muted-foreground inline-flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" />
                              {typeof professor.rating === 'number' ? professor.rating.toFixed(1) : professor.rating}
                              {professor.numRatings && (
                                <span className="ml-1">({professor.numRatings})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
              }}
              disabled={!value}
            >
              {value ? "Confirm Selection" : "Select a Professor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
