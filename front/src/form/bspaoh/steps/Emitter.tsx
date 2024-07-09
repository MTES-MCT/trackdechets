import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../context";

const actor = "emitter";

export function Emitter() {
  const { register, setValue, watch } = useFormContext();
  const sealedFields = useContext(SealedFieldsContext);

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
        disabled={sealedFields.includes(`${actor}.company.siret`)}
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
              company.contact || emitter?.company?.contact
            );

            setValue(
              `${actor}.company.phone`,
              company.contactPhone || emitter?.company?.phone
            );

            setValue(
              `${actor}.company.mail`,
              company.contactEmail || emitter?.company?.mail
            );
            // country: company.codePaysEtrangerEtablissement
          }
        }}
      />
      <CompanyContactInfo
        fieldName={`${actor}.company`}
        disabled={sealedFields.includes(`emitter.company.siret`)}
        key={orgId}
      />

      <Input
        label="Champ libre (optionnel)"
        disabled={sealedFields.includes("emitter.customInfo")}
        textArea
        nativeTextAreaProps={{ ...register("emitter.customInfo") }}
      />
    </>
  );
}
