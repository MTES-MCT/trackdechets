import React, { useContext } from "react";
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
  const { control, setValue, watch } = useFormContext();
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

  const companyField = `${fieldName}.detenteur.company`;
  const privateField = `${fieldName}.detenteur.isPrivateIndividual`;

  const weight = watch(`${fieldName}.weight`);
  const isPrivate = watch(privateField);
  const selectedOrgId = watch(`${companyField}.orgId`);
  const sealedFields = useContext(SealedFieldsContext);

  React.useEffect(() => {
    if (isPrivate) {
      setValue(`${companyField}.siret`, undefined);
      setValue(`${companyField}.orgId`, undefined);
      setValue(
        `${companyField}.name`,
        watch(`${companyField}.contact`) || "Détenteur particulier"
      );
    }
  }, [isPrivate, setValue, companyField]);

  React.useEffect(() => {
    if (isInstallationType && emitterCompany) {
      const emitterIdentifier = emitterCompany.orgId || emitterCompany.siret;
      if (!emitterIdentifier) return;

      const current = watch(companyField);
      const currentIdentifier = current?.orgId || current?.siret;
      const isSameOrEmpty =
        !currentIdentifier || currentIdentifier === emitterIdentifier;

      if (isSameOrEmpty) {
        setValue(companyField, {
          orgId: emitterCompany.orgId,
          siret: emitterCompany.siret,
          name: emitterCompany.name,
          address: emitterCompany.address,
          contact: emitterCompany.contact,
          phone: emitterCompany.phone,
          mail: emitterCompany.mail
        });
      }
    }
  }, [isInstallationType, emitterCompany]);

  // toutes les fiches d'intervention du formulaire
  const ficheInterventions = watch("ficheInterventions");

  // le numéro saisi dans CETTE fiche
  const currentNumero = watch(`${fieldName}.numero`);

  // l'objet COMPLET correspondant au numéro
  const currentFicheIntervention = ficheInterventions?.find(
    fi => fi.numero === currentNumero
  );

  // DEBUG : objet réel lié au numéro
  React.useEffect(() => {
    if (currentNumero) {
      console.log(" Numéro saisi :", currentNumero);
      console.log(
        " Objet fiche intervention lié :",
        currentFicheIntervention
      );
    }
  }, [currentNumero, currentFicheIntervention]);

  return (
    <div className="fr-col-12">
      {/*  CAS TRACER FLUIDE */}
      {isTracerFluide && (
        <>
          <h4 className="fr-mt-4w">Détenteur</h4>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
            <div className="fr-col-12">
              <CompanySelectorWrapper
                orgId={orgId}
                selectedCompanyOrgId={selectedOrgId}
                onCompanySelected={company => {
                  if (!company) return;

                  setValue(`${companyField}.orgId`, company.orgId);
                  setValue(`${companyField}.siret`, company.siret);
                  setValue(`${companyField}.name`, company.name);
                  setValue(`${companyField}.address`, company.address);
                  setValue(`${companyField}.contact`, company.contact);
                  setValue(`${companyField}.phone`, company.contactPhone);
                  setValue(`${companyField}.mail`, company.contactEmail);

                  // ← synchronise l'émetteur avec le détenteur pour TracerFluide
                  if (isTracerFluide) {
                    setValue("emitter.company", {
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
                  }
                }}
              />
            </div>
          </div>

          <CompanyContactInfo fieldName={companyField} key={selectedOrgId} />

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
              watch(`${companyField}.orgId`) ?? watch(`${companyField}.siret`)
            }
            disabled
            onCompanySelected={() => {}}
          />

          <CompanyContactInfo fieldName={companyField} key={orgId} />

          <hr className="fr-mt-4w" />
        </>
      )}

      {/* CAS NORMAL */}
      {!isInstallationType && !isTracerFluide && (
        <>
          {/* FICHE INTERVENTION */}
          <h4 className="fr-mt-4w">Fiche d’intervention (optionnel) </h4>

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

                            // 1. récupérer le numéro de fiche d’intervention du FORMULAIRE ACTUEL
                            const ficheNumero = watch(`${fieldName}.numero`);

                            // 2. retrouver l’objet complet dans la liste globale
                            const ficheIntervention = (
                              watch("ficheInterventions") ?? []
                            ).find((f: any) => f.numero === ficheNumero);

                            // 3. récupérer le packaging complet
                            const selectedPackaging = packagingInfos.find(
                              p => p.numero === numero
                            );

                            console.log(" CHECKBOX DEBUG", {
                              ficheNumero,
                              ficheIntervention,
                              packagingNumero: numero,
                              selectedPackaging,
                              checked,
                              nextValue
                            });

                            field.onChange(nextValue);
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

          {/* DETENTEUR */}
          <h4 className="fr-mt-4w">Détenteur</h4>

          <Controller
            control={control}
            name={privateField}
            render={({ field }) => (
              <ToggleSwitch
                label="Le détenteur est un particulier"
                checked={field.value ?? false}
                onChange={checked => setValue(privateField, checked)}
                disabled={sealedFields.includes("ficheInterventions")}
              />
            )}
          />

          {/* PARTICULIER */}
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
                          nativeInputProps={field}
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
              {/* ENTREPRISE */}
              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-col-12">
                  <CompanySelectorWrapper
                    orgId={orgId}
                    selectedCompanyOrgId={selectedOrgId}
                    onCompanySelected={company => {
                      if (!company) return;

                      setValue(`${companyField}.orgId`, company.orgId);
                      setValue(`${companyField}.siret`, company.siret);
                      setValue(`${companyField}.name`, company.name);
                      setValue(`${companyField}.address`, company.address);

                      setValue(`${companyField}.contact`, company.contact);
                      setValue(`${companyField}.phone`, company.contactPhone);
                      setValue(`${companyField}.mail`, company.contactEmail);
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
