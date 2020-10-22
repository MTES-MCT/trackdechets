import React from "react";

import { PaperWriteIcon } from "common/components/Icons";

import { generatePath, Link, useParams } from "react-router-dom";
import { COLORS } from "common/config";
import routes from "common/routes";

type Props = { formId: string; small?: boolean };

export default function Edit({ formId, small = true }: Props) {
  const { siret } = useParams<{ siret: string }>();
  const className = small
    ? "slips-actions__button"
    : "btn btn--outline-primary";

  return (
    <Link
      to={generatePath(routes.dashboard.slips.edit, { siret, id: formId })}
      title="Modifier"
      className={className}
    >
      <PaperWriteIcon size={24} color={COLORS.blueLight} />
      <span>Modifier</span>
    </Link>
  );
}
