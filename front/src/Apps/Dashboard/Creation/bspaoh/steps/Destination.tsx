import React, { useMemo, useEffect, useContext } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  FavoriteType,
  CompanySearchResult,
  WasteProcessorType
} from "@td/codegen-ui";
import { useFormContext, useWatch } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { clearCompanyError, setFieldError } from "../../utils";

const actor = "destination";

export function Destination({ errors }) {
  const { register, setValue, formState, setError, clearErrors } =
    useFormContext(); // retrieve all hook methods
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

  const destination = useWatch({ name: actor }) ?? {};

  useEffect(() => {
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length &&
      !destination.company.siret
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
  }, [
    errors,
    errors?.length,
    formState.errors,
    formState.errors?.length,
    setError,
    destination?.company?.siret
  ]);

  const { siret } = useParams<{ siret: string }>();

  const orgId = useMemo(
    () => destination?.company?.orgId ?? destination?.company?.siret ?? null,
    [destination?.company?.orgId, destination?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // Le destinatiare doit être inscrit et avec un profil crématorium ou sous-type crémation
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
            if (company.siret !== destination?.company?.siret) {
              setValue(`${actor}.company.contact`, company.contact);
              setValue(`${actor}.company.phone`, company.contactPhone);
              setValue(`${actor}.company.mail`, company.contactEmail);
            } else {
              setValue(
                `${actor}.company.contact`,
                destination?.company?.contact
              );
              setValue(`${actor}.company.phone`, destination?.company?.phone);

              setValue(`${actor}.company.mail`, destination?.company?.mail);
            }
            setValue(`${actor}.company.orgId`, company.orgId);
            setValue(`${actor}.company.siret`, company.siret);
            setValue(`${actor}.company.name`, company.name);
            setValue(`${actor}.company.vatNumber`, company.vatNumber);
            setValue(`${actor}.company.address`, company.address);

            if (errors?.length) {
              // server errors
              clearCompanyError(destination, actor, clearErrors);
            }
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
        errorObject={formState.errors?.destination?.["company"]}
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
