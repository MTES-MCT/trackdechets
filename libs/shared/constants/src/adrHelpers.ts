interface GetFormWasteDetailsADRMentionProps {
  isSubjectToADR?: boolean | null | undefined;
  onuCode?: string | null | undefined;
}

export const getFormWasteDetailsADRMention = (
  wasteDetails: GetFormWasteDetailsADRMentionProps | null | undefined
) => {
  return getFormADRMention({
    wasteDetailsIsSubjectToADR: wasteDetails?.isSubjectToADR,
    wasteDetailsOnuCode: wasteDetails?.onuCode
  });
};

export const getFormStateSummaryADRMention = getFormWasteDetailsADRMention;

interface GetFormADRMentionProps {
  wasteDetailsIsSubjectToADR?: boolean | null | undefined;
  wasteDetailsOnuCode?: string | null | undefined;
}

export const getFormADRMention = ({
  wasteDetailsIsSubjectToADR,
  wasteDetailsOnuCode
}: GetFormADRMentionProps = {}) => {
  // New method with ADR switch
  if (
    wasteDetailsIsSubjectToADR !== null &&
    wasteDetailsIsSubjectToADR !== undefined
  ) {
    if (wasteDetailsIsSubjectToADR) {
      return wasteDetailsOnuCode;
    } else {
      return "Déclaré non soumis à l'ADR";
    }
  }

  // Legacy
  return wasteDetailsOnuCode ?? "Non soumis";
};

interface GeBsdaWasteADRMentionProps {
  isSubjectToADR?: boolean | null | undefined;
  adr?: string | null | undefined;
}

export const getBsdaWasteADRMention = (
  bsdaWaste: GeBsdaWasteADRMentionProps | null | undefined
) => {
  const { isSubjectToADR, adr } = bsdaWaste || {};

  // New method with ADR switch
  if (isSubjectToADR !== null && isSubjectToADR !== undefined) {
    if (isSubjectToADR) {
      return adr;
    } else {
      return "Déclaré non soumis à l'ADR";
    }
  }

  // Legacy
  return adr ?? "Non soumis";
};
