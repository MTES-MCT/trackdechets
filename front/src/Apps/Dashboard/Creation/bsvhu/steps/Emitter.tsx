import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect, useMemo, useContext } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/RhfCompanySelectorWrapper";

import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { setFieldError } from "../../utils";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import DsfrfWorkSiteAddress from "../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";

const EmitterBsvhu = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext();

  const emitter = watch("emitter") ?? {};
  const sealedFields = useContext(SealedFieldsContext);

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("emitter.company.orgId");
    register("emitter.company.siret");
    register("emitter.company.name");
    register("emitter.company.vatNumber");
    register("emitter.company.address");
    register("emitter.irregularSituation");
    register("emitter.noSiret");
  }, [register]);

  useEffect(() => {
    const actor = "emitter";
    if (
      errors?.length &&
      errors?.length !== Object.keys(formState.errors)?.length &&
      (!emitter?.company?.siret || !emitter?.company?.orgId)
    ) {
      setFieldError(
        errors,
        `${actor}.company.siret`,
        formState.errors?.[actor]?.["company"]?.siret,
        setError
      );

      setFieldError(
        errors,
        `${actor}.company.name`,
        formState.errors?.[actor]?.["company"]?.name,
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
    emitter?.company?.orgId,
    clearErrors
  ]);

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // L'émetteur est en situation irrégulière mais il a un SIRET et n'est pas inscrit sur Trackdéchets
    if (company) {
      if (!company.isRegistered) {
        return "L'entreprise n'est pas inscrite sur Trackdéchets, la signature Producteur ne pourra pas se faire. Vous pouvez publier le bordereau, mais seul le transporteur pourra le signer.";
      }
    }
    return null;
  };

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <Checkbox
          options={[
            {
              label: "Installation en situation irrégulière",
              nativeInputProps: {
                ...register("emitter.irregularSituation")
              }
            }
          ]}
          disabled={sealedFields.includes(`emitter.irregularSituation`)}
        />
        <h4 className="fr-h4">Entreprise</h4>
        <CompanySelectorWrapper
          orgId={siret}
          favoriteType={FavoriteType.Emitter}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          selectedCompanyOrgId={orgId}
          selectedCompanyError={selectedCompanyError}
          onCompanySelected={company => {
            if (company) {
              let companyData = {
                orgId: company.orgId,
                siret: company.siret,
                vatNumber: company.vatNumber,
                name: company.name ?? "",
                address: company.address ?? "",
                contact: company.contact ?? "",
                phone: company.contactPhone ?? "",
                mail: company.contactEmail ?? "",
                country: company.codePaysEtrangerEtablissement
              };

              let agrementNumber =
                company?.vhuAgrementDemolisseur?.agrementNumber ?? "";

              // [tra-13734] don't override field with api data keep the user data value
              if (company.siret === emitter?.company?.siret) {
                companyData = {
                  orgId: company.orgId,
                  siret: company.siret,
                  vatNumber: company.vatNumber,
                  name: (emitter?.company?.name || company.name) as string,
                  address: (emitter?.company?.address ||
                    company.address) as string,
                  contact: (emitter?.company?.contact ||
                    company.contact) as string,
                  phone: (emitter?.company?.phone ||
                    company.contactPhone) as string,
                  mail: (emitter?.company?.mail ||
                    company.contactEmail) as string,
                  country: company.codePaysEtrangerEtablissement
                };

                agrementNumber = (emitter?.agrementNumber ||
                  company?.vhuAgrementDemolisseur?.agrementNumber) as string;
              }

              setValue("emitter", {
                ...emitter,
                company: {
                  ...emitter.company,
                  ...companyData
                },
                agrementNumber
              });
            }
          }}
        />
        {formState.errors?.emitter?.["company"]?.orgId?.message && (
          <p
            id="text-input-error-desc-error"
            className="fr-mb-4v fr-error-text"
          >
            {formState.errors?.emitter?.["company"]?.orgId?.message}
          </p>
        )}
        {formState.errors?.emitter?.["company"]?.siret && (
          <p className="fr-mb-4v fr-error-text">
            {formState.errors?.emitter?.["company"]?.siret?.message}
          </p>
        )}

        <Checkbox
          options={[
            {
              label: "L'installation n'a pas de numéro SIRET",
              nativeInputProps: {
                ...register("emitter.noSiret")
              }
            }
          ]}
          disabled={sealedFields.includes(`emitter.noSiret`)}
        />

        <DsfrfWorkSiteAddress
          designation="du site d'enlèvement"
          address={emitter.company.address}
          postalCode={emitter.company.postalCode}
          city={emitter.company.city}
          placeholder="Rechercher"
          onAddressSelection={details => {
            // `address` is passed as `name` because of adresse api return fields
            setValue(`emitter.company.address`, details.name);
            setValue(`emitter.company.city`, details.city);
            setValue(`emitter.company.postalCode`, details.postcode);
          }}
        />

        {emitter.noSiret && (
          <div className="fr-col-md-8 fr-mb-2w">
            <Input
              label="Nom ou identification de l'installation"
              disabled={sealedFields.includes(`emitter.company.name`)}
              nativeInputProps={{ ...register("emitter.company.name") }}
              state={formState.errors?.emitter?.["company"]?.name && "error"}
              stateRelatedMessage={
                (formState.errors?.emitter?.["company"]?.name
                  ?.message as string) ?? ""
              }
            />
          </div>
        )}

        <CompanyContactInfo
          fieldName={"emitter.company"}
          name="emitter"
          disabled={sealedFields.includes(`emitter.company.siret`)}
          key={orgId}
        />
      </div>
      <div className="fr-col-md-8">
        <Input
          label="Numéro d'agrément démolisseur"
          disabled={sealedFields.includes(`emitter.agrementNumber`)}
          nativeInputProps={{ ...register("emitter.agrementNumber") }}
        />
      </div>
    </>
  );
};

export default EmitterBsvhu;