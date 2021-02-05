import * as React from "react";
import { FormSearchResult, FormStatus } from "generated/graphql/types";

interface FormColumnStatusProps {
  searchResult: FormSearchResult;
}

export function FormColumnStatus({ searchResult }: FormColumnStatusProps) {
  return <>{searchResult.status === FormStatus.Draft && "Brouillon"}</>;
}
