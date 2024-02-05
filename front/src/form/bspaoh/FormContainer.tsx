import React from "react";
import { useParams, useLocation } from "react-router-dom";

import { ControlledTabs } from "./FormSteps";

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();

  return (
    <main className="main">
      <div className="container fr-mt-4w">
        <ControlledTabs bsdId={id} />
      </div>
    </main>
  );
}
