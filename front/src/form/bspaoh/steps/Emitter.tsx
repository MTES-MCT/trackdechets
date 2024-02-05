import React, { useMemo, useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../form/common/components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";

const actor = "emitter";

export function Emitter() {
  const { register, setValue, watch } = useFormContext();

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
  }, [register]);

  const { siret } = useParams<{ siret: string }>();
  const emitter = watch(actor) ?? {};

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  return (
    <>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Emitter}
        disabled={false}
        selectedCompanyOrgId={orgId}
        onCompanySelected={company => {
          if (company) {
            setValue(`${actor}.company.orgId`, company.orgId);
            setValue(`${actor}.company.siret`, company.siret);
            setValue(`${actor}.company.name`, company.name);
            setValue(`${actor}.company.vatNumber`, company.vatNumber);
            setValue(`${actor}.company.address`, company.address);
            setValue(
              `${actor}.company.contact`,
              emitter?.company?.contact || company.contact
            );
            setValue(
              `${actor}.company.phone`,
              emitter?.company?.phone || company.contactPhone
            );

            setValue(
              `${actor}.company.mail`,
              emitter?.company?.mail || company.contactEmail
            );
            // country: company.codePaysEtrangerEtablissement
          }
        }}
      />
      <CompanyContactInfo
        fieldName={`${actor}.company`}
        disabled={false}
        key={orgId}
      />

      <Input
        label="Champ libre (optionnel)"
        textArea
        nativeTextAreaProps={{ ...register("emitter.customInfo") }}
      />
    </>
  );
}
