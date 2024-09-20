import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";

export const getTabClassName = (errorTabIds, currentTabId) => {
  return errorTabIds?.includes(currentTabId)
    ? ("tabError fr-icon-warning-line" as unknown as
        | FrIconClassName
        | RiIconClassName)
    : "fr-icon-arrow-right-line";
};
