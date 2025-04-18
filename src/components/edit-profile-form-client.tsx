"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Character limits for each field
const charLimits = {
  fullName: 50,
  username: 30,
  bio: 500,
  avatarUrl: 255
};

export default function EditProfileFormClient({ profile }: { profile: any }) {
  const [fullNameCount, setFullNameCount] = useState(0);
  const [usernameCount, setUsernameCount] = useState(0);
  const [bioCount, setBioCount] = useState(0);
  const [avatarUrlCount, setAvatarUrlCount] = useState(0);

  // Initialize counts on component mount
  useEffect(() => {
    setFullNameCount(profile?.full_name?.length || 0);
    setUsernameCount(profile?.username?.length || 0);
    setBioCount(profile?.bio?.length || 0);
    setAvatarUrlCount(profile?.avatar_url?.length || 0);
  }, [profile]);

  return (
    <form
      action="/api/profile/update"
      method="POST"
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="full_name">Full Name</Label>
              <span className="text-xs text-muted-foreground">
                {fullNameCount}/{charLimits.fullName}
              </span>
            </div>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile?.full_name || ""}
              placeholder="Your full name"
              maxLength={charLimits.fullName}
              onChange={(e) => setFullNameCount(e.target.value.length)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="username">Username</Label>
              <span className="text-xs text-muted-foreground">
                {usernameCount}/{charLimits.username}
              </span>
            </div>
            <Input
              id="username"
              name="username"
              defaultValue={profile?.username || ""}
              placeholder="Choose a username"
              maxLength={charLimits.username}
              onChange={(e) => setUsernameCount(e.target.value.length)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="bio">Bio</Label>
            <span className="text-xs text-muted-foreground">
              {bioCount}/{charLimits.bio}
            </span>
          </div>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio || ""}
            placeholder="Tell us about yourself"
            rows={4}
            maxLength={charLimits.bio}
            onChange={(e) => setBioCount(e.target.value.length)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="avatar_url">Profile Picture URL</Label>
            <span className="text-xs text-muted-foreground">
              {avatarUrlCount}/{charLimits.avatarUrl}
            </span>
          </div>
          <Input
            id="avatar_url"
            name="avatar_url"
            defaultValue={profile?.avatar_url || ""}
            placeholder="https://example.com/your-image.jpg"
            maxLength={charLimits.avatarUrl}
            onChange={(e) => setAvatarUrlCount(e.target.value.length)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full md:w-auto">
        Save Changes
      </Button>
    </form>
  );
}
