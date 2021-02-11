import * as React from "react";
import { FormSearchResult, FormStatus } from "generated/graphql/types";
import { MarkAsSealedButton } from "./MarkAsSealedButton";

interface FormColumnActionsProps {
  searchResult: FormSearchResult;
}

export function FormColumnActions({ searchResult }: FormColumnActionsProps) {
  return (
    <>
      {searchResult.status === FormStatus.Draft && (
        <MarkAsSealedButton searchResult={searchResult} />
      )}
    </>
  );
}
