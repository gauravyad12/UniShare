"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarWithClearProps {
  placeholder: string;
  defaultValue?: string;
  baseUrl: string;
  tabParam?: string;
}

export default function SearchBarWithClear({
  placeholder,
  defaultValue = "",
  baseUrl,
  tabParam,
}: SearchBarWithClearProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(defaultValue);
  const [showClearButton, setShowClearButton] = useState(!!defaultValue);

  // Update the search value when defaultValue changes
  useEffect(() => {
    setSearchValue(defaultValue);
    setShowClearButton(!!defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the URL with search parameter
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (tabParam) params.set("tab", tabParam);
    
    // Reset to page 1 when search changes
    params.set("page", "1");
    
    // Navigate to the URL
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchValue("");
    setShowClearButton(false);
    
    // Build the URL without search parameter
    const params = new URLSearchParams();
    if (tabParam) params.set("tab", tabParam);
    
    // Reset to page 1
    params.set("page", "1");
    
    // Navigate to the URL
    const queryString = params.toString() ? `?${params.toString()}` : "";
    router.push(`${baseUrl}${queryString}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="search"
        placeholder={placeholder}
        className="pl-10 pr-10"
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setShowClearButton(!!e.target.value);
        }}
      />
      {showClearButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </form>
  );
}
