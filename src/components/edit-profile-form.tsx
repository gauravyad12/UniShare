"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

// Character limits for each field
const charLimits = {
  fullName: 50,
  username: 30,
  bio: 500,
  avatarUrl: 255,
  major: 50
};

export default function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
    major: profile?.major || ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Check if the value exceeds the character limit
    const fieldName = name === 'full_name' ? 'fullName' : 
                      name === 'avatar_url' ? 'avatarUrl' : name;
    
    const limit = charLimits[fieldName as keyof typeof charLimits];
    if (limit && value.length > limit) {
      return; // Don't update if exceeding the limit
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Success - refresh the page
      router.refresh();
      router.push("/dashboard/profile");
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="full_name">Full Name</Label>
              <span className="text-xs text-muted-foreground">
                {formData.full_name.length}/{charLimits.fullName}
              </span>
            </div>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              maxLength={charLimits.fullName}
              className={error && error.includes("name") ? "border-red-500" : ""}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="username">Username</Label>
              <span className="text-xs text-muted-foreground">
                {formData.username.length}/{charLimits.username}
              </span>
            </div>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              maxLength={charLimits.username}
              className={error && error.includes("username") ? "border-red-500" : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">
              {formData.bio.length}/{charLimits.bio}
            </span>
          </div>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
            rows={4}
            maxLength={charLimits.bio}
            className={error && error.includes("bio") ? "border-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="major">Major</Label>
            <span className="text-xs text-muted-foreground">
              {formData.major.length}/{charLimits.major}
            </span>
          </div>
          <Input
            id="major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            placeholder="Your field of study"
            maxLength={charLimits.major}
            className={error && error.includes("major") ? "border-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="avatar_url">Profile Picture URL</Label>
            <span className="text-xs text-muted-foreground">
              {formData.avatar_url.length}/{charLimits.avatarUrl}
            </span>
          </div>
          <Input
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleChange}
            placeholder="https://example.com/your-image.jpg"
            maxLength={charLimits.avatarUrl}
            className={error && error.includes("avatar") ? "border-red-500" : ""}
          />
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
