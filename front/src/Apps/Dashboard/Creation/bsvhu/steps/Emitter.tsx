import { Input } from "@codegouvfr/react-dsfr/Input";
import React, { useEffect, useMemo, useContext } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

import { CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import { clearCompanyError, setFieldError } from "../../utils";
import DsfrfWorkSiteAddress from "../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";

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
    register("emitter.company.city");
    register("emitter.company.street");
    register("emitter.company.postalCode");
    register("emitter.irregularSituation");
    register("emitter.noSiret");
  }, [register]);

  useEffect(() => {
    const actor = "emitter";
    if (errors?.length) {
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
  }, [
    errors,
    errors?.length,
    formState,
    setError,
    emitter?.company?.siret,
    emitter?.company?.orgId
  ]);

  useEffect(() => {
    if (errors?.length && (emitter?.noSiret || emitter?.company?.siret)) {
      clearCompanyError(emitter, "emitter", clearErrors);
    }
  }, [clearErrors, emitter?.noSiret, emitter?.company?.siret, errors?.length]);

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    // L'émetteur est en situation irrégulière mais il a un SIRET et n'est pas inscrit sur Trackdéchets
    if (company) {
      if (!emitter.irregularSituation && !company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets. Il ne peut être visé comme émetteur sur ce bordereau, sauf s'il s'agit d'une installation en situation irrégulière. Dans ce cas, veuillez cocher la case correspondante ci-dessus.";
      } else if (formState.errors?.emitter?.["company"]?.siret?.message) {
        return formState.errors?.emitter?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  const onNoSiretClick = () => {
    if (emitter.company.siret) {
      setValue("emitter.company", {});
      setValue("emitter.agrementNumber", null);
      setValue("emitter.company.siret", null);
      setValue("emitter.company.name", "");
      setValue("emitter.company.contact", "");
      setValue("emitter.company.phone", "");
      setValue("emitter.company.mail", "");
      setValue("emitter.company.address", "");
    }
  };

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10 fr-mt-4w">
        <SingleCheckbox
          options={[
            {
              label: "Installation en situation irrégulière",
              nativeInputProps: {
                ...register("emitter.irregularSituation"),
                onChange: e => {
                  setValue(
                    "emitter.irregularSituation",
                    e.currentTarget.checked
                  );
                  if (!e.currentTarget.checked) {
                    setValue("emitter.noSiret", false);
                  } else {
                    if (emitter.agrementNumber) {
                      setValue("emitter.agrementNumber", "");
                    }
                  }
                }
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
                  contact: emitter?.company?.contact,
                  phone: emitter?.company?.phone,
                  mail: emitter?.company?.mail,
                  country: company.codePaysEtrangerEtablissement
                };

                agrementNumber = emitter?.agrementNumber;
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
        {!emitter?.company?.siret &&
          formState.errors?.emitter?.["company"]?.siret && (
            <p className="fr-text--sm fr-error-text fr-mb-4v">
              {formState.errors?.emitter?.["company"]?.siret?.message}
            </p>
          )}

        {emitter.irregularSituation && (
          <>
            <SingleCheckbox
              options={[
                {
                  label: "L'installation n'a pas de SIRET",
                  nativeInputProps: {
                    ...register("emitter.noSiret"),
                    onClick: onNoSiretClick
                  }
                }
              ]}
              disabled={sealedFields.includes(`emitter.noSiret`)}
            />

            {emitter.noSiret && (
              <>
                <DsfrfWorkSiteAddress
                  designation="du site d'enlèvement"
                  address={emitter.company?.address}
                  postalCode={emitter.company?.postalCode}
                  city={emitter.company?.city}
                  placeholder="Rechercher"
                  onAddressSelection={details => {
                    // `address` is passed as `name` because of adresse api return fields
                    setValue(`emitter.company.address`, details.label);
                    setValue(`emitter.company.city`, details.city);
                    setValue(`emitter.company.street`, details.name);
                    setValue(`emitter.company.postalCode`, details.postcode);
                  }}
                />
                {formState.errors?.emitter?.["company"]?.address?.message && (
                  <p
                    id="text-input-error-desc-error"
                    className="fr-mb-4v fr-error-text"
                  >
                    {formState.errors?.emitter?.["company"]?.address?.message}
                  </p>
                )}
                <div className="fr-col-md-8 fr-mb-2w">
                  <Input
                    label="Nom ou identification de l'installation"
                    disabled={sealedFields.includes(`emitter.company.name`)}
                    nativeInputProps={{ ...register("emitter.company.name") }}
                    state={
                      formState.errors?.emitter?.["company"]?.name && "error"
                    }
                    stateRelatedMessage={
                      (formState.errors?.emitter?.["company"]?.name
                        ?.message as string) ?? ""
                    }
                  />
                </div>
              </>
            )}
          </>
        )}

        <CompanyContactInfo
          fieldName={"emitter.company"}
          errorObject={formState.errors?.emitter?.["company"]}
          disabled={sealedFields.includes(`emitter.company.siret`)}
          key={orgId}
        />
      </div>
      {!emitter.irregularSituation && (
        <div className="fr-col-md-8">
          <Input
            label="Numéro d'agrément démolisseur"
            disabled={sealedFields.includes(`emitter.agrementNumber`)}
            nativeInputProps={{ ...register("emitter.agrementNumber") }}
          />
        </div>
      )}
    </>
  );
};

export default EmitterBsvhu;
