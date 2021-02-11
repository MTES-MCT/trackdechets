import * as React from "react";
import { FormSearchResult, FormStatus } from "generated/graphql/types";
import { MarkAsSealedButton } from "./MarkAsSealedButton";
import { ActionsDropdown } from "./ActionsDropdown";
import styles from "./FormColumnActions.module.scss";

interface FormColumnActionsProps {
  searchResult: FormSearchResult;
}

export function FormColumnActions({ searchResult }: FormColumnActionsProps) {
  return (
    <div className={styles.FormColumnActions}>
      {searchResult.status === FormStatus.Draft && (
        <MarkAsSealedButton searchResult={searchResult} />
      )}
      <ActionsDropdown searchResult={searchResult} />
    </div>
  );
}
