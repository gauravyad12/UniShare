"use client";

import { useState, useEffect } from "react";
import ResourceView from "./resource-view";
import { createClient } from "@/utils/supabase/client";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  course_code?: string;
  professor?: string;
  file_url?: string;
  external_link?: string;
  author_id: string;
  created_at: string;
  view_count: number;
  download_count: number;
  likes?: number;
}

export default function ResourceViewWrapper({
  resource,
  isOwner = false,
}: {
  resource: Resource;
  isOwner?: boolean;
}) {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <ResourceView
      resource={resource}
      isOwner={isOwner}
      currentUserId={currentUserId}
    />
  );
}
