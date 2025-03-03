import React from "react";

type Props = { value: number | undefined; label: string };

export function Stat({ value, label }: Props) {
  return (
    <div className="tw-flex tw-flex-col fr-m-2w">
      <span className="tw-text-4xl tw-font-bold">{value ?? 0}</span>
      <span className="fr-mt-1w fr-text--md">{label}</span>
    </div>
  );
}
