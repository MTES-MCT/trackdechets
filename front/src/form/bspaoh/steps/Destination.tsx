import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  FavoriteType,
  CompanySearchResult,
  WasteProcessorType
} from "@td/codegen-ui";
import { useFormContext, useWatch } from "react-hook-form";
import CompanySelectorWrapper from "../../../Apps/common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../Apps/Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../context";

const actor = "destination";

export function Destination({ errors }) {
  const { register, setValue, formState, setError } = useFormContext(); // retrieve all hook methods
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register(`${actor}.company.orgId`);
    register(`${actor}.company.siret`);
    register(`${actor}.company.name`);
    register(`${actor}.company.vatNumber`);
    register(`${actor}.company.address`);
    register(`${actor}.company.contact`);
    register(`${actor}.company.phone`);
    register(`${actor}.company.mail`);
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

  const destination = useWatch({ name: actor }) ?? {};
  const orgId = useMemo(
    () => destination?.company?.orgId ?? destination?.company?.siret ?? null,
    [destination?.company?.orgId, destination?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // Le destinatiare doi être inscrit et avec un profil crématorium ou sous-type crémation
    // Le profil crématorium sera bientôt supprimé
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets, il ne peut pas être ajouté sur le bordereau.";
      } else if (
        !company.wasteProcessorTypes?.includes(WasteProcessorType.Cremation)
      ) {
        return "Cet établissement n'a pas le profil Crématorium (et cimetières pour la Guyane).";
      }
    }
    return null;
  };
  return (
    <div>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Transporter}
        disabled={sealedFields.includes(`${actor}.company.siret`)}
        selectedCompanyOrgId={orgId}
        selectedCompanyError={selectedCompanyError}
        onCompanySelected={company => {
          if (company) {
            setValue(`${actor}.company.orgId`, company.orgId);
            setValue(`${actor}.company.siret`, company.siret);
            setValue(`${actor}.company.name`, company.name);
            setValue(`${actor}.company.vatNumber`, company.vatNumber);
            setValue(`${actor}.company.address`, company.address);
            setValue(
              `${actor}.company.contact`,
              company.contact || destination?.company?.contact
            );
            setValue(
              `${actor}.company.phone`,
              company.contactPhone || destination?.company?.phone
            );

            setValue(
              `${actor}.company.mail`,
              company.contactEmail || destination?.company?.mail
            );
          }
        }}
      />
      {formState.errors?.destination?.["company"]?.siret && (
        <p className="fr-text--sm fr-error-text fr-mb-4v">
          {formState.errors?.destination?.["company"]?.siret?.message}
        </p>
      )}

      <CompanyContactInfo
        fieldName={`${actor}`}
        disabled={sealedFields.includes(`${actor}.company.siret`)}
        key={orgId}
      />

      <Input
        label="Numéro de CAP (optionnel)"
        disabled={sealedFields.includes(`${actor}.cap`)}
        nativeInputProps={{
          ...register(`${actor}.cap`)
        }}
      />

      <Input
        label="Champ libre (optionnel)"
        disabled={sealedFields.includes(`${actor}.customInfo`)}
        textArea
        nativeTextAreaProps={{
          ...register(`${actor}.customInfo`)
        }}
      />
    </div>
  );
}
