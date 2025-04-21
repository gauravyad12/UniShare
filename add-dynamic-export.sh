#!/bin/bash

# Find all route.ts and route.tsx files in the API directory
find src/app/api -name "route.ts" -o -name "route.tsx" | while read -r file; do
  # Check if the file already has the export
  if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
    # Add the export after the imports
    awk '
    BEGIN { added = 0 }
    /^import/ { print; next }
    !added && !/^import/ { print "\nexport const dynamic = \"force-dynamic\";\n"; added = 1; print; next }
    { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    echo "Added dynamic export to $file"
  else
    echo "Dynamic export already exists in $file"
  fi
done

# Find all page.tsx files that need the dynamic export
find src/app -name "page.tsx" | while read -r file; do
  # Check if the file already has the export
  if ! grep -q "export const dynamic = 'force-dynamic'" "$file"; then
    # Add the export after the imports
    awk '
    BEGIN { added = 0 }
    /^import/ { print; next }
    !added && !/^import/ { print "\nexport const dynamic = \"force-dynamic\";\n"; added = 1; print; next }
    { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    echo "Added dynamic export to $file"
  else
    echo "Dynamic export already exists in $file"
  fi
done
