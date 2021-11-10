import React, { useMemo } from "react";
type Props = {
  label: string;
  bsddValue;
  reviewValue;
  formatter?: (value: any) => React.ReactNode;
};

export function RevisionField({
  label,
  bsddValue,
  reviewValue,
  formatter = value => value,
}: Props) {
  const formattedBsddValue = useMemo(() => formatter(bsddValue), [
    formatter,
    bsddValue,
  ]);
  const formattedReviewValue = useMemo(() => formatter(reviewValue), [
    formatter,
    reviewValue,
  ]);

  if (!formattedReviewValue) return null;

  return (
    <div className="tw-flex tw-flex-wrap tw-py-2 tw-border-t-2">
      <p className="tw-w-1/4 tw-font-bold">Ancien {label} :</p>
      <p className="tw-w-3/4">{formattedBsddValue ?? "Aucune valeur"}</p>
      <p className="tw-w-1/4 tw-font-bold">Nouveau {label} :</p>
      <p className="tw-w-3/4">{formattedReviewValue}</p>
    </div>
  );
}
