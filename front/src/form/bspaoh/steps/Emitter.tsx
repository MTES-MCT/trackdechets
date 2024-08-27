import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../context";

const actor = "emitter";

export function Emitter({ errors }) {
  const { register, setValue, watch, formState, setError } = useFormContext();
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
  }, [register]);

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length
    ) {
      const siretError = errors?.find(
        error => error.name === `${actor}.company.siret`
      )?.message;

      if (
        siretError &&
        !!formState.errors?.[actor]?.["company"]?.siret === false
      ) {
        setError(`${actor}.company.siret`, {
          type: "custom",
          message: siretError
        });
      }

      const contactError = errors?.find(
        error => error.name === `${actor}.company.contact`
      )?.message;
      if (
        contactError &&
        !!formState.errors?.[actor]?.["company"]?.contact === false
      ) {
        console.log(
          "errors cont ",
          errors?.find(error => error.name === `${actor}.company.contact`)
        );

        setError(`${actor}.company.contact`, {
          type: "custom",
          message: contactError
        });
      }

      const adressError = errors?.find(
        error => error.name === `${actor}.company.address`
      )?.message;
      if (
        adressError &&
        !!formState.errors?.[actor]?.["company"]?.address === false
      ) {
        setError(`${actor}.company.address`, {
          type: "custom",
          message: adressError
        });
      }
      const phoneError = errors?.find(
        error => error.name === `${actor}.company.phone`
      )?.message;
      if (
        phoneError &&
        !!formState.errors?.[actor]?.["company"]?.phone === false
      ) {
        setError(`${actor}.company.phone`, {
          type: "custom",
          message: phoneError
        });
      }
      const mailError = errors?.find(
        error => error.name === `${actor}.company.mail`
      )?.message;
      if (
        mailError &&
        !!formState.errors?.[actor]?.["company"]?.mail === false
      ) {
        setError(`${actor}.company.mail`, {
          type: "custom",
          message: mailError
        });
      }

      const vatNumberError = errors?.find(
        error => error.name === `${actor}.company.vatNumber`
      )?.message;
      if (
        vatNumberError &&
        !!formState.errors?.[actor]?.["company"]?.vatNumber === false
      ) {
        setError(`${actor}.company.vatNumber`, {
          type: "custom",
          message: vatNumberError
        });
      }
    }
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors?.length,
    setError
  ]);

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

      {formState.errors?.emitter?.["company"]?.orgId?.message && (
        <p id="text-input-error-desc-error" className="fr-mb-4v fr-error-text">
          {formState.errors?.emitter?.["company"]?.orgId?.message}
        </p>
      )}

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
