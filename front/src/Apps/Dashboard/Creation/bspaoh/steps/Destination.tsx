import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  FavoriteType,
  CompanySearchResult,
  WasteProcessorType
} from "@td/codegen-ui";
import { useFormContext, useWatch } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import {
  isCompanyAddressPath,
  isCompanyContactPath,
  isCompanyMailPath,
  isCompanyPhonePath,
  isCompanySiretPath,
  isVatNumberPath
} from "../../utils";

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
      const siretError = isCompanySiretPath(errors, actor);
      if (
        siretError &&
        !!formState.errors?.[actor]?.["company"]?.siret === false
      ) {
        setError(`${actor}.company.siret`, {
          type: "custom",
          message: siretError
        });
      }

      const contactError = isCompanyContactPath(errors, actor);
      if (
        contactError &&
        !!formState.errors?.[actor]?.["company"]?.contact === false
      ) {
        setError(`${actor}.company.contact`, {
          type: "custom",
          message: contactError
        });
      }

      const adressError = isCompanyAddressPath(errors, actor);
      if (
        adressError &&
        !!formState.errors?.[actor]?.["company"]?.address === false
      ) {
        setError(`${actor}.company.address`, {
          type: "custom",
          message: adressError
        });
      }

      const phoneError = isCompanyPhonePath(errors, actor);
      if (
        phoneError &&
        !!formState.errors?.[actor]?.["company"]?.phone === false
      ) {
        setError(`${actor}.company.phone`, {
          type: "custom",
          message: phoneError
        });
      }
      const mailError = isCompanyMailPath(errors, actor);
      if (
        mailError &&
        !!formState.errors?.[actor]?.["company"]?.mail === false
      ) {
        setError(`${actor}.company.mail`, {
          type: "custom",
          message: mailError
        });
      }

      const vatNumberError = isVatNumberPath(errors, actor);
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
        return "Cet établissement n'a pas le profil Crémation.";
      }
    }
    return null;
  };
  return (
    <div>
      <CompanySelectorWrapper
        orgId={siret}
        favoriteType={FavoriteType.Destination}
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
        fieldName={`${actor}.company`}
        name={actor}
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
