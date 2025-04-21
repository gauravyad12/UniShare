#!/bin/bash

# Find all files that use useSearchParams
grep -r "useSearchParams" --include="*.tsx" src/app | cut -d: -f1 | sort -u | while read -r file; do
  # Check if the file is a client component
  if grep -q "\"use client\"" "$file"; then
    # Check if the file already imports Suspense
    if ! grep -q "import { Suspense" "$file" && ! grep -q "import Suspense" "$file" && ! grep -q "import React, { Suspense" "$file"; then
      # Add Suspense import
      sed -i '' 's/import React, { \(.*\) } from "react";/import React, { \1, Suspense } from "react";/g' "$file"
      sed -i '' 's/import { \(.*\) } from "react";/import { \1, Suspense } from "react";/g' "$file"
      
      # If no React import, add it
      if ! grep -q "import.*from \"react\"" "$file"; then
        sed -i '' '1s/^/"use client";\n\nimport { Suspense } from "react";\n/' "$file"
      fi
    fi
    
    # Check if useSearchParams is already wrapped in Suspense
    if ! grep -q "Suspense.*useSearchParams" "$file"; then
      # Wrap the component that uses useSearchParams in Suspense
      sed -i '' 's/const searchParams = useSearchParams();/const SearchParamsWrapper = () => {\n  const searchParams = useSearchParams();\n  return searchParams;\n};\n\n  const searchParams = <Suspense fallback={null}><SearchParamsWrapper \/><\/Suspense>;/g' "$file"
    fi
    
    echo "Fixed useSearchParams in $file"
  fi
done
