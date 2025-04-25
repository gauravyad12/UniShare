"use client";

import React from "react";
import SearchBarWithClear from "./search-bar-with-clear";

interface StyledSearchBarWrapperProps {
  placeholder: string;
  defaultValue?: string;
  baseUrl: string;
  tabParam?: string;
}

export default function StyledSearchBarWrapper({
  placeholder,
  defaultValue = "",
  baseUrl,
  tabParam,
}: StyledSearchBarWrapperProps) {
  return (
    <div className="bg-background/80 backdrop-blur-md rounded-full px-3 py-1 shadow-sm border border-primary/10 hover:border-primary/20 transition-all duration-300 search-bar-container w-full">
      <SearchBarWithClear
        placeholder={placeholder}
        defaultValue={defaultValue}
        baseUrl={baseUrl}
        tabParam={tabParam}
        className="bg-transparent border-none shadow-none rounded-full transition-all duration-300"
      />
    </div>
  );
}
