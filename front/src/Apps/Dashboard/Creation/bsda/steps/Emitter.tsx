import React, { useContext, useEffect, useMemo } from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

import { BsdaType, CompanySearchResult, FavoriteType } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError } from "../../utils";
import DsfrfWorkSiteAddress from "../../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Input from "@codegouvfr/react-dsfr/Input";

const EmitterBsda = () => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, clearErrors } =
    useFormContext();

  const emitter = watch("emitter", {});
  const sealedFields = useContext(SealedFieldsContext);
  const bsdaType = watch("type");

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
  }, [register]);

  useEffect(() => {
    if (emitter?.company?.siret) {
      setValue("emitter", emitter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orgId = useMemo(
    () => emitter?.company?.orgId ?? emitter?.company?.siret ?? null,
    [emitter?.company?.orgId, emitter?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets. Il ne peut être visé comme émetteur sur ce bordereau.";
      } else if (formState.errors?.emitter?.["company"]?.siret?.message) {
        return formState.errors?.emitter?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  const isBsdaSuite = [BsdaType.Gathering, BsdaType.Reshipment].includes(
    bsdaType as BsdaType
  );

  if (isBsdaSuite && !emitter?.company?.siret) {
    return (
      <Alert
        title=""
        description="Veuillez sélectionner les bordereaux à associer avant de compléter
        l'émetteur."
        severity="error"
      />
    );
  }

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <div className="fr-col-md-10">
        {isBsdaSuite ? (
          <Alert
            title=""
            description={`Vous effectuez un groupement ou une réexpédition. L'entreprise
            émettrice est obligatoirement la vôtre.`}
            severity="info"
            className="fr-mb-2w"
          />
        ) : (
          <SingleCheckbox
            options={[
              {
                label: "Le MOA ou le détenteur est un particulier",
                nativeInputProps: {
                  ...register("emitter.isPrivateIndividual"),
                  onChange: e => {
                    setValue(
                      "emitter.isPrivateIndividual",
                      e.currentTarget.checked
                    );
                    if (e.currentTarget.checked) {
                      setValue("emitter.company.siret", null);
                      setValue("emitter.company.orgId", null);
                      setValue("emitter.company.vatNumber", null);
                      setValue("emitter.company.name", null);
                    }

                    setValue("emitter.company.contact", null);
                    setValue("emitter.company.address", null);
                    setValue("emitter.company.city", null);
                    setValue("emitter.company.street", null);
                    setValue("emitter.company.postalCode", null);
                    setValue("emitter.company.phone", null);
                    setValue("emitter.company.mail", null);
                  }
                }
              }
            ]}
            disabled={sealedFields.includes(`emitter.isPrivateIndividual`)}
          />
        )}

        {emitter?.isPrivateIndividual &&
          bsdaType === BsdaType.OtherCollections && (
            <Alert
              title=""
              description="Si le particulier est en charge du transport direct vers
              l'exutoire, merci de bien vouloir utiliser un bordereau de
              collecte en déchèterie."
              severity="warning"
              className="fr-mt-2w fr-mb-4w"
            />
          )}

        {emitter?.isPrivateIndividual ? (
          <>
            <h4 className="fr-h4">Particulier</h4>

            <div className="form__row">
              {emitter?.isPrivateIndividual ? (
                <Input
                  label="Nom et prénom"
                  nativeInputProps={{
                    ...register("emitter.company.name")
                  }}
                  disabled={sealedFields.includes(`emitter.company.name`)}
                  state={
                    formState.errors?.emitter?.["company"]?.name && "error"
                  }
                  stateRelatedMessage={
                    (formState.errors?.emitter?.["company"]?.name
                      ?.message as string) ?? ""
                  }
                />
              ) : (
                <Input
                  label="Personne à contacter"
                  nativeInputProps={{
                    ...register("emitter.company.contact")
                  }}
                  disabled={sealedFields.includes(`emitter.company.contact`)}
                  state={
                    formState.errors?.emitter?.["company"]?.contact && "error"
                  }
                  stateRelatedMessage={
                    (formState.errors?.emitter?.["company"]?.contact
                      ?.message as string) ?? ""
                  }
                />
              )}
            </div>
            <div className="form__row">
              <DsfrfWorkSiteAddress
                address={emitter?.company?.address}
                city={emitter?.company?.city}
                postalCode={emitter?.company?.postalCode}
                onAddressSelection={details => {
                  // `address` is passed as `name` because of adresse api return fields
                  setValue("emitter.company.address", details.name);
                  setValue("emitter.company.city", details.city);
                  setValue("emitter.company.postalCode", details.postcode);
                }}
                designation=""
              />
            </div>
            <div className="fr-grid-row">
              <Input
                label="Téléphone"
                nativeInputProps={{
                  ...register("emitter.company.phone")
                }}
                disabled={sealedFields.includes(`emitter.company.phone`)}
                className="fr-col-md-4 fr-mr-2w"
                state={formState.errors?.emitter?.["company"]?.phone && "error"}
                stateRelatedMessage={
                  (formState.errors?.emitter?.["company"]?.phone
                    ?.message as string) ?? ""
                }
              />
              <Input
                label="Courriel"
                nativeInputProps={{
                  ...register("emitter.company.mail")
                }}
                disabled={sealedFields.includes(`emitter.company.mail`)}
                className="fr-col-md-6"
                state={formState.errors?.emitter?.["company"]?.mail && "error"}
                stateRelatedMessage={
                  (formState.errors?.emitter?.["company"]?.mail
                    ?.message as string) ?? ""
                }
              />
            </div>
          </>
        ) : (
          <>
            <h4 className="fr-h4">Établissement</h4>
            <CompanySelectorWrapper
              orgId={siret}
              favoriteType={FavoriteType.Emitter}
              disabled={
                sealedFields.includes(`emitter.company.siret`) || isBsdaSuite
              }
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
                  }

                  clearCompanyError(emitter, "emitter", clearErrors);

                  setValue("emitter", {
                    ...emitter,
                    company: {
                      ...emitter.company,
                      ...companyData
                    }
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
            <CompanyContactInfo
              fieldName={"emitter.company"}
              errorObject={formState.errors?.emitter?.["company"]}
              disabled={sealedFields.includes(`emitter.company.siret`)}
              key={orgId}
            />
          </>
        )}

        {!isBsdaSuite && (
          <>
            <h4 className="fr-h4 fr-mt-4w">
              Adresse de chantier ou de collecte (optionnel)
            </h4>
            <Input
              label="Nom du site d’enlèvement (optionnel)"
              nativeInputProps={{
                ...register("emitter.pickupSite.name")
              }}
              state={formState.errors?.emitter?.["pickupSite"]?.name && "error"}
              stateRelatedMessage={
                (formState.errors?.emitter?.["pickupSite"]?.name
                  ?.message as string) ?? ""
              }
            />
            <DsfrfWorkSiteAddress
              address={emitter?.pickupSite?.address}
              city={emitter?.pickupSite?.city}
              postalCode={emitter?.pickupSite?.postalCode}
              onAddressSelection={details => {
                // `address` is passed as `name` because of adresse api return fields
                setValue("emitter.pickupSite.address", details.name);
                setValue("emitter.pickupSite.city", details.city);
                setValue("emitter.pickupSite.postalCode", details.postcode);
              }}
              designation="du site d’enlèvement (optionnel)"
            />

            <Input
              label="Informations complémentaires (optionnel)"
              textArea
              nativeTextAreaProps={{
                placeholder: "Champ libre pour préciser…",
                ...register("emitter.pickupSite.infos")
              }}
              disabled={sealedFields.includes(`emitter.pickupSite.infos`)}
              state={
                formState.errors?.emitter?.["pickupSite"]?.infos && "error"
              }
              stateRelatedMessage={
                (formState.errors?.emitter?.["pickupSite"]?.infos
                  ?.message as string) ?? ""
              }
            />
          </>
        )}
      </div>
    </>
  );
};

export default EmitterBsda;
