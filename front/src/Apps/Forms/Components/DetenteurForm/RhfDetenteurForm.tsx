import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { BsffType } from "@td/codegen-ui";

import CompanySelectorWrapper from "../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";
import CompanyContactInfo from "../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DsfrfWorkSiteAddress from "../../../../form/common/components/dsfr-work-site/DsfrfWorkSiteAddress";

type Props = {
  orgId?: string;
  fieldName: string;
};

export function RhfDetenteurForm({ orgId, fieldName }: Props) {
  const { control, setValue, watch } = useFormContext();

  const type = watch("type");

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

  React.useEffect(() => {
    if (isPrivate) {
      setValue(`${companyField}.siret`, undefined);
      setValue(`${companyField}.orgId`, undefined);
    }
  }, [isPrivate, setValue, companyField]);

  return (
    <div className="fr-container">
      {/*  CAS TRACER FLUIDE */}
      {isTracerFluide && (
        <>
          <h4 className="fr-mt-4w fr-mb-3w">Détenteur</h4>

          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8">
              <Controller
                control={control}
                name={`${companyField}.name`}
                render={({ field }) => (
                  <Input
                    label="SIRET ou raison sociale"
                    nativeInputProps={field}
                  />
                )}
              />
            </div>

            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${companyField}.postalCode`}
                render={({ field }) => (
                  <Input label="Code postal" nativeInputProps={field} />
                )}
              />
            </div>
          </div>

          <div className="fr-mt-3w">
            <Controller
              control={control}
              name={`${companyField}.contact`}
              render={({ field }) => (
                <Input label="Personne à contacter" nativeInputProps={field} />
              )}
            />
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
            <div className="fr-col-md-6">
              <Controller
                control={control}
                name={`${companyField}.phone`}
                render={({ field }) => (
                  <Input label="Téléphone" nativeInputProps={field} />
                )}
              />
            </div>

            <div className="fr-col-md-6">
              <Controller
                control={control}
                name={`${companyField}.mail`}
                render={({ field }) => (
                  <Input label="Courriel" nativeInputProps={field} />
                )}
              />
            </div>
          </div>

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
            selectedCompanyOrgId={orgId}
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
          <h4 className="fr-mt-4w">Fiche d’intervention</h4>

          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.numero`}
                render={({ field }) => (
                  <Input
                    label="N° de fiche d'intervention"
                    nativeInputProps={field}
                  />
                )}
              />
            </div>

            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.postalCode`}
                render={({ field }) => (
                  <Input
                    label="Code postal de collecte"
                    nativeInputProps={field}
                  />
                )}
              />
            </div>

            <div className="fr-col-md-4">
              <Controller
                control={control}
                name={`${fieldName}.weight`}
                render={({ field }) => (
                  <Input
                    label="Poids total retiré en kilos"
                    nativeInputProps={{ ...field, type: "number" }}
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
              />
            )}
          />

          {/* PARTICULIER */}
          {isPrivate ? (
            <>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.name`}
                    render={({ field }) => (
                      <Input label="Nom et prénom" nativeInputProps={field} />
                    )}
                  />
                </div>

                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.contact`}
                    render={({ field }) => (
                      <Input
                        label="Personne à contacter"
                        nativeInputProps={field}
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
                />
              </div>

              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.phone`}
                    render={({ field }) => (
                      <Input label="Téléphone" nativeInputProps={field} />
                    )}
                  />
                </div>

                <div className="fr-col-md-6">
                  <Controller
                    control={control}
                    name={`${companyField}.mail`}
                    render={({ field }) => (
                      <Input label="Courriel" nativeInputProps={field} />
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ENTREPRISE */}
              <div className="fr-grid-row fr-grid-row--gutters fr-mt-3w">
                <div className="fr-container">
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
