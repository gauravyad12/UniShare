#!/bin/bash

# List of pages that need to be fixed
PAGES=(
  "src/app/404/page.tsx"
  "src/app/(auth)/sign-up/page.tsx"
  "src/app/(auth)/verify-invite/page.tsx"
  "src/app/academic-integrity/page.tsx"
  "src/app/ai-tools/page.tsx"
  "src/app/community-guidelines/page.tsx"
  "src/app/contact/page.tsx"
  "src/app/copyright-policy/page.tsx"
  "src/app/error/page.tsx"
  "src/app/fallback-error/page.tsx"
  "src/app/help-center/page.tsx"
  "src/app/page.tsx"
  "src/app/success/page.tsx"
  "src/app/terms-of-service/page.tsx"
  "src/app/unblock-websites/page.tsx"
  "src/app/universities/page.tsx"
)

# Loop through each page and check if it uses useSearchParams
for page in "${PAGES[@]}"; do
  if [ -f "$page" ] && grep -q "useSearchParams" "$page"; then
    echo "Fixing $page..."
    
    # Check if the file is a client component
    if grep -q "\"use client\"" "$page"; then
      # Add the SearchParamsProvider import if not already present
      if ! grep -q "import.*SearchParamsProvider" "$page"; then
        sed -i '' '/^import/a\\nimport { SearchParamsProvider } from "@/components/search-params-wrapper";' "$page"
      fi
      
      # Add the useCallback import if not already present
      if ! grep -q "import.*useCallback" "$page"; then
        sed -i '' 's/import { \(.*\) } from "react";/import { \1, useCallback } from "react";/g' "$page"
      fi
      
      # Add the state and callback for search params
      if ! grep -q "const handleParamsChange" "$page"; then
        sed -i '' '/function/,/return/s/const \[.*\] = useState<.*>/&\n  const [params, setParams] = useState<URLSearchParams | null>(null);\n\n  const handleParamsChange = useCallback((newParams: URLSearchParams) => {\n    setParams(newParams);\n  }, []);/g' "$page"
      fi
      
      # Add the SearchParamsProvider component to the JSX
      if ! grep -q "<SearchParamsProvider" "$page"; then
        sed -i '' '/return/,/>/s/<>/&\n      <SearchParamsProvider onParamsChange={handleParamsChange} \/>/g' "$page"
      fi
      
      # Replace useSearchParams usage with params
      sed -i '' 's/const searchParams = useSearchParams();//g' "$page"
      sed -i '' 's/searchParams\./params?./g' "$page"
      
      echo "Fixed $page"
    else
      echo "Skipping $page - not a client component"
    fi
  else
    echo "Skipping $page - does not use useSearchParams or file not found"
  fi
done
