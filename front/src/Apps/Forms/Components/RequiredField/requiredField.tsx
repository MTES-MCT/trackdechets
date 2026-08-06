import React from "react";

export const requiredLabel = (label: string, required: boolean) =>
  required ? (
    <>
      {label} <span aria-hidden="true">*</span>
    </>
  ) : (
    label
  );

export const requiredAria = (required: boolean) => ({
  "aria-required": (required ? "true" : "false") as "true" | "false"
});
