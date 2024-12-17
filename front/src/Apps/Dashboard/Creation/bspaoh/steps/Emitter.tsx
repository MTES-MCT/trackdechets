import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

import { FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../../context";
import { setFieldError } from "../../utils";

const actor = "emitter";

export function Emitter({ errors }) {
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext();
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
  }, [register]);

  const emitter = watch(actor) ?? {};

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length
    ) {
      setFieldError(
        errors,
        `${actor}.company.siret`,
        formState.errors?.[actor]?.["company"]?.siret,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.contact`,
        formState.errors?.[actor]?.["company"]?.contact,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.address`,
        formState.errors?.[actor]?.["company"]?.address,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.phone`,
        formState.errors?.[actor]?.["company"]?.phone,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.mail`,
        formState.errors?.[actor]?.["company"]?.mail,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.vatNumber`,
        formState.errors?.[actor]?.["company"]?.vatNumber,
        setError
      );
    }

    if (
      (formState.errors?.emitter?.["company"]?.orgId?.message ||
        formState.errors?.emitter?.["company"]?.siret?.message) &&
      emitter?.company?.siret
    ) {
      clearErrors(`${actor}.company.orgId`);
    }
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors?.length,
    setError,
    emitter?.company?.siret,
    clearErrors
  ]);

  const { siret } = useParams<{ siret: string }>();

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
      {formState.errors?.emitter?.["company"]?.siret && (
        <p className="fr-mb-4v fr-error-text">
          {formState.errors?.emitter?.["company"]?.siret?.message}
        </p>
      )}

      <CompanyContactInfo
        fieldName={`${actor}.company`}
        errorObject={formState.errors?.emitter?.["company"]}
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
