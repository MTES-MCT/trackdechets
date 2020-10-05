import React from "react";

import { PaperWriteIcon } from "src/common/components/Icons";

import { Link } from "react-router-dom";
import { COLORS } from "src/common/config";
type Props = { formId: string; small?: boolean };

export default function Edit({ formId, small = true }: Props) {
  const className = small
    ? "slips-actions__button"
    : "btn btn--outline-primary";

  return (
    <Link to={`/form/${formId}`} title="Modifier" className={className}>
      <PaperWriteIcon size={24} color={COLORS.blueLight} />
      <span>Modifier</span>
    </Link>
  );
}
