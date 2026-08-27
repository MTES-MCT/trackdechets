import React, { useContext, useRef, useEffect, useCallback } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { BsffType } from "@td/codegen-ui";

import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import CompanyContactInfo from "../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DsfrfWorkSiteAddress from "../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";
import { SealedFieldsContext } from "../../../../Apps/Dashboard/Creation/context";
import SingleCheckbox from "../../../common/Components/SingleCheckbox/SingleCheckbox";

type Props = {
  orgId?: string;
  fieldName: string;
};

export function RhfDetenteurForm({ orgId, fieldName }: Props) {
  const { control, setValue, watch, getValues } = useFormContext();

  const emitterCompany = watch("emitter.company");

  const type = watch("type");
  const packagingInfos = watch("packagings");
  const isCollectePetitesQuantites = type === BsffType.CollectePetitesQuantites;

  const INSTALLATION_TYPES = [
    BsffType.Reexpedition,
    BsffType.Groupement,
    BsffType.Reconditionnement
  ];

  const isInstallationType = INSTALLATION_TYPES.includes(type);

  const isTracerFluide = type === BsffType.TracerFluide;

  const companyField = isTracerFluide
    ? "emitter.company"
    : `${fieldName}.detenteur.company`;

  const privateField = `${fieldName}.detenteur.isPrivateIndividual`;

  const weight = watch(`${fieldName}.weight`);

  const isPrivate = watch(privateField);

  const selectedOrgId = watch(`${companyField}.orgId`);

  const sealedFields = useContext(SealedFieldsContext);
  const hasInitializedTracerFluide = useRef(false);
  useEffect(() => {
    if (!isTracerFluide || hasInitializedTracerFluide.current) return;
    hasInitializedTracerFluide.current = true;
  }, [isTracerFluide]);

  /**
   * CAS PARTICULIER
   */

  const previousIsPrivate = useRef(isPrivate);
  const resetHolderCompanyFields = useCallback(
    (nextIsPrivate: boolean) => {
      setValue(`${companyField}.orgId`, undefined);
      setValue(`${companyField}.siret`, undefined);
      setValue(`${companyField}.vatNumber`, undefined);
      setValue(`${companyField}.country`, undefined);
      setValue(
        `${companyField}.name`,
        nextIsPrivate ? "Détenteur particulier" : ""
      );
      setValue(`${companyField}.address`, "");
      setValue(`${companyField}.city`, "");
      setValue(`${companyField}.postalCode`, "");
      setValue(`${companyField}.contact`, "");
      setValue(`${companyField}.phone`, "");
      setValue(`${companyField}.mail`, "");
    },
    [companyField, setValue]
  );

  useEffect(() => {
    const holderTypeChanged = previousIsPrivate.current !== isPrivate;

    if (!holderTypeChanged) {
      return;
    }

    resetHolderCompanyFields(isPrivate);

    previousIsPrivate.current = isPrivate;
  }, [isPrivate, resetHolderCompanyFields]);
  /**
   * CAS INSTALLATION
   */
  const hasInitializedInstallationDetenteur = React.useRef(false);

  React.useEffect(() => {
    if (
      !isInstallationType ||
      !emitterCompany ||
      hasInitializedInstallationDetenteur.current
    ) {
      return;
    }

    const emitterIdentifier = emitterCompany.orgId || emitterCompany.siret;
    if (!emitterIdentifier) return;

    const current = getValues(companyField);
    const currentIdentifier = current?.orgId || current?.siret;
    const isEmpty = !currentIdentifier;
    const isSameCompany = currentIdentifier === emitterIdentifier;

    if (isEmpty || isSameCompany) {
      setValue(`${companyField}.orgId`, emitterCompany.orgId);
      setValue(`${companyField}.siret`, emitterCompany.siret);

      if (!current?.name) {
        setValue(`${companyField}.name`, emitterCompany.name);
      }

      if (!current?.address) {
        setValue(`${companyField}.address`, emitterCompany.address);
      }

      if (!current?.contact) {
        setValue(`${companyField}.contact`, emitterCompany.contact);
      }

      if (!current?.phone) {
        setValue(`${companyField}.phone`, emitterCompany.phone);
      }

      if (!current?.mail) {
        setValue(`${companyField}.mail`, emitterCompany.mail);
      }
    }

    hasInitializedInstallationDetenteur.current = true;
  }, [isInstallationType, emitterCompany, companyField, getValues, setValue]);

  const syncCompanyWithoutOverriding = (company: any) => {
    const current = getValues(companyField);
    const currentOrgId = current?.orgId || current?.siret;
    const newOrgId = company.orgId || company.siret;
    const isNewCompany = currentOrgId !== newOrgId;

    setValue(`${companyField}.orgId`, company.orgId);
    setValue(`${companyField}.siret`, company.siret);

    setValue(
      `${companyField}.name`,
      isNewCompany ? company.name : current?.name ?? company.name
    );

    setValue(
      `${companyField}.address`,
      isNewCompany ? company.address : current?.address ?? company.address
    );

    setValue(
      `${companyField}.contact`,
      isNewCompany ? company.contact : current?.contact ?? company.contact
    );

    setValue(
      `${companyField}.phone`,
      isNewCompany
        ? company.contactPhone
        : current?.phone ?? company.contactPhone
    );

    setValue(
      `${companyField}.mail`,
      isNewCompany
        ? company.contactEmail
        : current?.mail ?? company.contactEmail
    );
  };

  // ======================================================
  // NOUVELLE FONCTIONNALITÉ : synchronisation fiche ↔ contenants
  // ======================================================

  const ficheInterventions = watch("ficheInterventions");

  // le numéro saisi dans CETTE fiche
  const currentNumero = watch(`${fieldName}.numero`);

  // la fiche correspondant au numéro
  const currentFicheIntervention = ficheInterventions?.find(
    fi => fi.numero === currentNumero
  );

  React.useEffect(() => {
    if (!currentFicheIntervention) return;

    const alreadyLinked = (currentFicheIntervention.packagings ?? [])
      .map((p: any) => p.numero)
      .filter(Boolean);

    if (!alreadyLinked.length) return;

    const current = watch(`${fieldName}.contenantsRattaches`) ?? [];

    if (current.length === 0) {
      setValue(`${fieldName}.contenantsRattaches`, alreadyLinked);
    }
  }, [
    currentFicheIntervention?.numero,
    currentFicheIntervention?.packagings,
    fieldName,
    setValue,
    watch
  ]);

  return (
    <div className="fr-col-12">
      {/* CAS TRACER FLUIDE  */}
      {isTracerFluide && (
        <>
          <h4 className="fr-mt-4w">Détenteur</h4>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
            <div className="fr-col-12">
              <CompanySelectorWrapper
                orgId={orgId}
                selectedCompanyOrgId={
                  watch(`${companyField}.orgId`) ??
                  watch(`${companyField}.siret`)
                }
                onCompanySelected={company => {
                  if (!company) return;
                  setValue(companyField, {
                    orgId: company.orgId,
                    siret: company.siret,
                    vatNumber: company.vatNumber ?? null,
                    name: company.name ?? "",
                    address: company.address ?? "",
                    contact: company.contact ?? "",
                    phone: company.contactPhone ?? "",
                    mail: company.contactEmail ?? "",
                    country: company.codePaysEtrangerEtablissement ?? null
                  });
                }}
              />
            </div>
          </div>

          <CompanyContactInfo fieldName={companyField} />

          <hr className="fr-mt-4w" />
        </>
      )}

      {/* CAS INSTALLATION */}
      {isInstallationType && (
        <>
          <Alert
            description="Vous effectuez un groupement, un reconditionnement ou une réexpédition. L'établissement émetteur est obligatoirement le vôtre."
            severity="info"
            small
            className="fr-mb-3w"
          />

          <h4 className="fr-mt-2w">Détenteur</h4>

          <CompanySelectorWrapper
            orgId={orgId}
            selectedCompanyOrgId={
              watch("emitter.company.orgId") ?? watch("emitter.company.siret")
            }
            disabled
            onCompanySelected={() => {}}
          />

          <CompanyContactInfo fieldName="emitter.company" />

          <hr className="fr-mt-4w" />
        </>
      )}

      {/* CAS NORMAL */}
      {!isInstallationType && !isTracerFluide && (
        <>
          <h4 className="fr-mt-4w">Fiche d'intervention (optionnel)</h4>

          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.numero`}
                render={({ field, fieldState }) => (
                  <Input
                    label="N° de fiche d'intervention"
                    state={fieldState.error ? "error" : "default"}
                    stateRelatedMessage={fieldState.error?.message}
                    nativeInputProps={{
                      name: field.name,
                      value: field.value ?? "",
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                      ref: field.ref
                    }}
                    disabled={sealedFields.includes("ficheInterventions")}
                  />
                )}
              />
            </div>

            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.postalCode`}
                render={({ field, fieldState }) => (
                  <Input
                    label="Code postal de collecte"
                    state={fieldState.error ? "error" : "default"}
                    stateRelatedMessage={fieldState.error?.message}
                    nativeInputProps={{
                      name: field.name,
                      value: field.value ?? "",
                      onChange: field.onChange,
                      onBlur: field.onBlur,
                      ref: field.ref
                    }}
                    disabled={sealedFields.includes("ficheInterventions")}
                  />
                )}
              />
            </div>

            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.weight`}
                render={({ field, fieldState }) => (
                  <Input
                    label="Poids total retiré en kilos"
                    state={fieldState.error ? "error" : "default"}
                    stateRelatedMessage={fieldState.error?.message}
                    nativeInputProps={{
                      type: "number",
                      value: field.value ?? "",
                      onChange: e => {
                        const val = e.target.value;
                        field.onChange(val === "" ? undefined : Number(val));
                      }
                    }}
                    disabled={sealedFields.includes("ficheInterventions")}
                  />
                )}
              />

              {weight && (
                <p className="fr-info-text">
                  Soit {(Number(weight) / 1000).toFixed(4)} tonne
                </p>
              )}
            </div>
          </div>

          {/* CONTENANTS RATTACHÉS */}
          {packagingInfos.length > 0 && (
            <>
              <h4 className="fr-mt-4w">Contenants rattachés</h4>

              <Controller
                control={control}
                name={`${fieldName}.contenantsRattaches`}
                defaultValue={[]}
                render={({ field }) => (
                  <SingleCheckbox
                    options={packagingInfos.map((packaging, index) => {
                      const numero =
                        packaging.numero ?? `Contenant ${index + 1}`;

                      return {
                        label: numero,
                        nativeInputProps: {
                          checked: field.value?.includes(numero),
                          onChange: e => {
                            const checked = e.target.checked;

                            const nextValue = checked
                              ? [...(field.value ?? []), numero]
                              : (field.value ?? []).filter(
                                  (n: string) => n !== numero
                                );

                            field.onChange(nextValue);

                            // index de la fiche actuelle
                            const ficheIndex = (
                              watch("ficheInterventions") ?? []
                            ).findIndex(
                              (fi: any) => fi.numero === currentNumero
                            );

                            if (ficheIndex === -1) return;

                            // packagings actuels de la fiche
                            const currentPackagings =
                              watch(
                                `ficheInterventions.${ficheIndex}.packagings`
                              ) ?? [];

                            let updatedPackagings;
                            if (checked) {
                              updatedPackagings = [
                                ...currentPackagings,
                                { id: packagingInfos[index].id, numero: numero }
                              ];
                            } else {
                              updatedPackagings = currentPackagings.filter(
                                (p: any) => p.numero !== numero
                              );
                            }

                            setValue(
                              `ficheInterventions.${ficheIndex}.packagings`,
                              updatedPackagings
                            );

                            console.log(
                              "PACKAGINGS FICHE UPDATED",
                              updatedPackagings
                            );
                          }
                        }
                      };
                    })}
                  />
                )}
              />
              <hr className="fr-mt-4w" />
            </>
          )}

          <h4 className="fr-mt-4w">Détenteur</h4>

          <Controller
            control={control}
            name={privateField}
            render={({ field }) => (
              <ToggleSwitch
                label="Le détenteur est un particulier"
                checked={field.value ?? false}
                onChange={checked => {
                  if (checked !== Boolean(field.value)) {
                    resetHolderCompanyFields(checked);
                  }

                  setValue(privateField, checked);
                }}
                disabled={sealedFields.includes("ficheInterventions")}
              />
            )}
          />

          {isPrivate ? (
            <>
              <div className="fr-grid-row fr-grid-row--gutters">
                {!isCollectePetitesQuantites && (
                  <div className="fr-col-md-6">
                    <Controller
                      control={control}
                      name={`${companyField}.name`}
                      render={({ field }) => (
                        <Input
                          label="Nom et prénom"
                          nativeInputProps={{
                            ...field,
                            onBlur: e => {
                              field.onChange(e.target.value.trim());
                              field.onBlur();
                            }
                          }}
                          disabled={sealedFields.includes("ficheInterventions")}
                        />
                      )}
                    />
                  </div>
                )}

                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.contact`}
                    render={({ field }) => (
                      <Input
                        label="Personne à contacter"
                        nativeInputProps={field}
                        disabled={sealedFields.includes("ficheInterventions")}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="fr-mt-3w">
                <DsfrfWorkSiteAddress
                  key={`${companyField}-${isPrivate}`}
                  address={watch(`${companyField}.address`)}
                  city={watch(`${companyField}.city`)}
                  postalCode={watch(`${companyField}.postalCode`)}
                  onAddressSelection={details => {
                    setValue(`${companyField}.address`, details.name);
                    setValue(`${companyField}.city`, details.city);
                    setValue(`${companyField}.postalCode`, details.postcode);
                  }}
                  designation="du détenteur"
                  disabled={sealedFields.includes("ficheInterventions")}
                />
              </div>

              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.phone`}
                    render={({ field }) => (
                      <Input
                        label="Téléphone (optionnel)"
                        nativeInputProps={field}
                        disabled={sealedFields.includes("ficheInterventions")}
                      />
                    )}
                  />
                </div>

                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.mail`}
                    render={({ field }) => (
                      <Input
                        label="Courriel"
                        nativeInputProps={field}
                        disabled={sealedFields.includes("ficheInterventions")}
                      />
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-col-12">
                  <CompanySelectorWrapper
                    orgId={orgId}
                    selectedCompanyOrgId={selectedOrgId}
                    onCompanySelected={company => {
                      if (!company) return;
                      syncCompanyWithoutOverriding(company);
                    }}
                    disabled={sealedFields.includes("ficheInterventions")}
                  />
                </div>
              </div>

              <CompanyContactInfo
                fieldName={companyField}
                key={selectedOrgId}
              />
            </>
          )}

          <hr className="fr-mt-4w" />
        </>
      )}
    </div>
  );
}
