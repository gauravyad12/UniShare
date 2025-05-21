"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { GraduationCap, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type University = {
  id: string;
  name: string;
  logo_url?: string;
};

type UniversitySearchProps = {
  onSelect: (id: string, name: string) => void;
};

export default function UniversitySearch({ onSelect }: UniversitySearchProps) {
  const [query, setQuery] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch universities when query changes
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        const url = query
          ? `/api/universities?query=${encodeURIComponent(query)}`
          : '/api/universities';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch universities');
        }

        const data = await response.json();

        // Don't add a standard user option - use the one from the database if it exists
        setUniversities(data.universities);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setLoading(false);
      }
    };

    // Use a simple timeout to avoid too many requests
    const timer = setTimeout(() => {
      fetchUniversities();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection
  const handleSelect = (university: University) => {
    setSelectedUniversity(university.id);
    onSelect(university.id, university.name);
    setQuery(university.name);
    setShowDropdown(false);
  };

  return (
    <div className="w-full max-w-xs relative" ref={containerRef}>
      {/* Search input with icon */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for your university..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full h-12 pl-10 pr-10 py-2 border border-input bg-background rounded-md"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>

        {query && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery('');
              setSelectedUniversity(null);
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="px-3 py-4 text-sm text-center">
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent mr-2 align-[-2px]"></div>
                Loading universities...
              </div>
            ) : universities.length > 0 ? (
              <ul className="py-1">
                {universities.map((university) => (
                  <li
                    key={university.id}
                    className={`px-3 py-2 h-10 cursor-pointer hover:bg-muted flex justify-between items-center ${selectedUniversity === university.id ? 'bg-primary/10' : ''}`}
                    onClick={() => handleSelect(university)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {university.logo_url ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                          <Image
                            src={university.logo_url}
                            alt={university.name}
                            width={24}
                            height={24}
                            className="object-contain w-auto h-auto max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <span className="text-sm truncate max-w-[200px]" title={university.name}>{university.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No universities found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
