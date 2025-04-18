#!/bin/bash

# Fix profile pages for Vercel build issues

# Fix src/app/profile/[username]/page.tsx
cat > src/app/profile/[username]/page.tsx << 'EOL'
import { redirect } from "next/navigation";

export default function ProfileRedirect({
  params,
}: {
  params: { username: string };
}) {
  // Early return if no username parameter
  if (!params || !params.username) {
    return redirect("/dashboard");
  }

  // Clean the username parameter (remove @ if present)
  const usernameParam = params.username.startsWith("@")
    ? params.username.substring(1)
    : params.username;

  // Redirect to the dashboard profile page with the username as a query parameter
  return redirect(
    `/dashboard/profile?username=${encodeURIComponent(usernameParam)}`,
  );
}
EOL

# Fix src/app/profile/@[username]/page.tsx
cat > src/app/profile/@[username]/page.tsx << 'EOL'
import { redirect } from "next/navigation";

export default function ProfileRedirect({
  params,
}: {
  params: { username: string };
}) {
  // Ensure params exists before accessing username
  if (!params || !params.username) {
    redirect("/");
    return null;
  }

  // Remove @ if it exists and redirect to the standard profile page
  const cleanUsername = params.username.startsWith("@")
    ? params.username.substring(1)
    : params.username;

  redirect(`/dashboard/profile?username=${encodeURIComponent(cleanUsername)}`);
}
EOL

# Fix src/app/dashboard/public-profile/[username]/page.tsx
sed -i '' 's/const handleFollowStatusChange = (status) => {/const username = params.username;\n\n  const handleFollowStatusChange = (status) => {/' src/app/dashboard/public-profile/[username]/page.tsx

echo "Fixed profile pages for Vercel build"
