import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { OptionalCompanySelector } from "./OptionalCompanySelector";

const GET_ECO_ORGANISMES = gql`
  query GetEcoOrganismes(
    $handleBsdd: Boolean
    $handleBsda: Boolean
    $handleBsdasri: Boolean
    $handleBsvhu: Boolean
  ) {
    ecoOrganismes(
      handleBsdd: $handleBsdd
      handleBsda: $handleBsda
      handleBsdasri: $handleBsdasri
      handleBsvhu: $handleBsvhu
    ) {
      id
      name
      siret
    }
  }
`;

type Props = {
  methods: UseFormReturn<any>;
  disabled?: boolean;
  reducedMargin?: boolean;
};

export function EcoOrganismes({ methods, disabled, reducedMargin }: Props) {
  const { data } = useQuery(GET_ECO_ORGANISMES);

  const prefix = "ecoOrganisme";
  const selectedSiret = methods.watch(`${prefix}Siret`);
  const ecoOrganismes = data?.ecoOrganismes || [];

  const isKnownEcoOrganisme = ecoOrganismes.some(
    ecoOrganisme => ecoOrganisme.siret === selectedSiret
  );

  return (
    <div className="fr-col">
      <OptionalCompanySelector
        prefix={prefix}
        methods={methods}
        disabled={disabled}
        shortMode={true}
        reducedMargin={reducedMargin}
        title="Éco-organisme (optionnel)"
        toggleLabel="Présence d'un éco-organisme"
      />

      {selectedSiret && !isKnownEcoOrganisme && (
        <div className={reducedMargin ? "fr-mt-1w" : ""}>
          <Alert
            description="Cet établissement ne figure pas dans notre liste d’éco-organismes. Il se peut qu'elle ne soit pas à jour, donc si le SIRET vous semble correct, vous pouvez l’ajouter à votre déclaration."
            severity="warning"
            small
          />
        </div>
      )}
    </div>
  );
}
