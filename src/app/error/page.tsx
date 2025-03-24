"use client";

import ErrorComponent from "../error";

export default function ErrorPage() {
  return (
    <ErrorComponent
      error={new Error("Error page accessed directly")}
      reset={() => (window.location.href = "/")}
    />
  );
}
