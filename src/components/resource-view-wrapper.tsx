"use client";

import { useState } from "react";
import ResourceView from "./resource-view";

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
  return <ResourceView resource={resource} isOwner={isOwner} />;
}
