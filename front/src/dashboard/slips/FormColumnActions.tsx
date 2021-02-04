import * as React from "react";
import { FormSearchResult, FormStatus } from "generated/graphql/types";

interface FormColumnActionsProps {
  searchResult: FormSearchResult;
}

export default function FormColumnActions({
  searchResult,
}: FormColumnActionsProps) {
  return (
    <>
      {searchResult.status === FormStatus.Draft && (
        <button type="button">Modifier</button>
      )}
    </>
  );
}
