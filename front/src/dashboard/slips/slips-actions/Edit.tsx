import React from "react";

import { IconPaperWrite } from "common/components/Icons";

import { generatePath, Link, useParams } from "react-router-dom";
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
      <IconPaperWrite size="24px" color="blueLight" />
      <span>Modifier</span>
    </Link>
  );
}
