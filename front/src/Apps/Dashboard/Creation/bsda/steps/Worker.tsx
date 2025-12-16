import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { useFormContext } from "react-hook-form";
import CompanySelectorWrapper from "../../../../common/Components/CompanySelectorWrapper/CompanySelectorWrapper";

import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  BsdaType,
  CompanySearchResult,
  CompanyType,
  FavoriteType
} from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { formatDate } from "../../../../../common/datetime";
import { NoWorkerAlert } from "../components/NoWorkerAlert";
import SingleCheckbox from "../../../../common/Components/SingleCheckbox/SingleCheckbox";
import { SealedFieldsContext } from "../../../../Dashboard/Creation/context";
import CompanyContactInfo from "../../../../Forms/Components/RhfCompanyContactInfo/RhfCompanyContactInfo";
import DisabledParagraphStep from "../../DisabledParagraphStep";
import { clearCompanyError, setFieldError } from "../../utils";

const Worker = ({ errors }) => {
  const { siret } = useParams<{ siret: string }>();
  const { register, setValue, watch, formState, setError, clearErrors } =
    useFormContext();
  const [companyTypes, setcompanyTypes] = useState<CompanyType[]>([]);

  const worker = watch("worker", {});
  const sealedFields = useContext(SealedFieldsContext);
  const bsdaType = watch("type");
  const isGroupement = bsdaType === BsdaType.Gathering;
  const isEntreposageProvisoire = bsdaType === BsdaType.Reshipment;
  const isDechetterie = bsdaType === BsdaType.Collection_2710;

  const isWorker = companyTypes?.includes(CompanyType.Worker) ?? false;

  const hasCertification =
    worker?.certification &&
    (worker?.certification.hasSubSectionThree ||
      worker?.certification.hasSubSectionFour);

  const updateWorkerState = useCallback(
    (workerSelected: CompanySearchResult) => {
      if (workerSelected) {
        if (workerSelected?.workerCertification) {
          setValue(
            "worker.certification.hasSubSectionFour",
            workerSelected?.workerCertification?.hasSubSectionFour
          );
          setValue(
            "worker.certification.hasSubSectionThree",
            workerSelected?.workerCertification?.hasSubSectionThree
          );
          setValue(
            "worker.certification.certificationNumber",
            workerSelected?.workerCertification?.certificationNumber
          );
          setValue(
            "worker.certification.validityLimit",
            workerSelected?.workerCertification?.validityLimit
          );
          setValue(
            "worker.certification.organisation",
            workerSelected?.workerCertification?.organisation
          );
        } else {
          setValue("worker.certification", null);
        }
      } else {
        setValue("worker.certification", null);
      }
    },
    [setValue]
  );

  useEffect(() => {
    // register fields managed under the hood by company selector
    register("worker.company.orgId");
    register("worker.company.siret");
    register("worker.company.name");
    register("worker.company.vatNumber");
    register("worker.company.address");
    register("worker.company.city");
    register("worker.company.street");
    register("worker.company.postalCode");
  }, [register]);

  useEffect(() => {
    if (worker?.company?.siret) {
      updateWorkerState(worker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const actor = "worker";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  const orgId = useMemo(
    () => worker?.company?.orgId ?? worker?.company?.siret ?? null,
    [worker?.company?.orgId, worker?.company?.siret]
  );

  const selectedCompanyError = (company?: CompanySearchResult) => {
    if (company) {
      if (!company.isRegistered) {
        return "Cet établissement n'est pas inscrit sur Trackdéchets. Il ne peut être visé comme entreprise de travaux sur ce bordereau.";
      } else if (!company.companyTypes?.includes(CompanyType.Worker)) {
        return `L'entreprise de travaux saisie sur le bordereau (SIRET: ${company.siret}) n'est pas inscrite sur Trackdéchets en tant qu'entreprise de travaux. Cette entreprise ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements.`;
      } else if (formState.errors?.worker?.["company"]?.siret?.message) {
        return formState.errors?.worker?.["company"]?.siret?.message;
      }
    }
    return null;
  };

  if (isGroupement || isEntreposageProvisoire || isDechetterie) {
    return (
      <Alert
        title=""
        description="Vous effectuez un groupement, une réexpédition ou une collecte en
        déchèterie. Il n'y a pas d'entreprise de travaux à saisir."
        severity="info"
      />
    );
  }

  return (
    <>
      {!!sealedFields.length && <DisabledParagraphStep />}
      <SingleCheckbox
        options={[
          {
            label: "Il n'y a pas d'entreprise de travaux",
            nativeInputProps: {
              ...register("worker.isDisabled"),
              onChange: e => {
                setValue("worker.isDisabled", e.currentTarget.checked);
                setValue("worker.company", null);
                setValue("worker.company.contact", null);
                setValue("worker.company.phone", null);
                setValue("worker.company.mail", null);
                setValue("worker.certification", null);
              }
            }
          }
        ]}
        disabled={sealedFields.includes(`worker.isDisabled`)}
      />

      {worker?.isDisabled && (
        <div className="fr-mt-4w">
          <NoWorkerAlert />
        </div>
      )}

      {!worker?.isDisabled && (
        <div className="fr-col-md-10">
          <h4 className="fr-h4">Entreprise de travaux</h4>
          <CompanySelectorWrapper
            orgId={siret}
            favoriteType={FavoriteType.Worker}
            disabled={sealedFields.includes(`worker.company.siret`)}
            selectedCompanyOrgId={orgId}
            selectedCompanyError={selectedCompanyError}
            onCompanySelected={company => {
              if (company) {
                setcompanyTypes(company.companyTypes as CompanyType[]);
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
                if (company.siret === worker?.company?.siret) {
                  companyData = {
                    orgId: company.orgId,
                    siret: company.siret,
                    vatNumber: company.vatNumber,
                    name: (worker?.company?.name || company.name) as string,
                    address: (worker?.company?.address ||
                      company.address) as string,
                    contact: worker?.company?.contact,
                    phone: worker?.company?.phone,
                    mail: worker?.company?.mail,
                    country: company.codePaysEtrangerEtablissement
                  };
                }

                if (errors?.length) {
                  // server errors
                  clearCompanyError(worker, "worker", clearErrors);
                }

                setValue("worker", {
                  ...worker,
                  company: {
                    ...worker.company,
                    ...companyData
                  }
                });

                updateWorkerState(company);
              }
            }}
          />
          {!worker?.company?.siret &&
            formState.errors?.worker?.["company"]?.siret && (
              <p className="fr-text--sm fr-error-text fr-mb-4v">
                {formState.errors?.worker?.["company"]?.siret?.message}
              </p>
            )}
          <CompanyContactInfo
            fieldName={"worker.company"}
            errorObject={formState.errors?.worker?.["company"]}
            disabled={sealedFields.includes(`worker.company.siret`)}
            key={orgId}
          />

          {worker.company?.siret && (
            <>
              <h4 className="form__section-heading">
                Catégorie entreprise de travaux déclarée dans le profil
                entreprise
              </h4>

              {!isWorker && (
                <div>
                  <Alert
                    title={
                      "L'entreprise n'est pas une entreprise de travaux amiante"
                    }
                    severity="error"
                    description="L'entreprise que vous renseignez ne s'est pas enregistrée avec un profil d'entreprise de travaux amiante ou n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations"
                  />
                </div>
              )}

              {isWorker && !hasCertification && (
                <div className="form__row">
                  {!worker?.certification?.hasSubSectionFour &&
                    !worker?.certification?.hasSubSectionThree && (
                      <Alert
                        title={"L'entreprise n'a pas complété son profil"}
                        severity="warning"
                        description="L'entreprise que vous renseignez s'est enregistrée avec un profil d'entreprise de travaux amiante mais n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations."
                      />
                    )}
                </div>
              )}
              <div className="form__row">
                {worker?.certification?.hasSubSectionThree && (
                  <Alert
                    title="Travaux relevant de la sous-section 3"
                    severity="success"
                    description={
                      <>
                        <p>
                          {" "}
                          N° de certification :{" "}
                          {worker?.certification?.certificationNumber}
                        </p>
                        <p>
                          Date de validité :{" "}
                          {formatDate(worker?.certification?.validityLimit!)}
                        </p>
                        <p>Organisme : {worker?.certification?.organisation}</p>
                      </>
                    }
                  />
                )}
              </div>
              <div className="form__row">
                {worker?.certification?.hasSubSectionFour && (
                  <Alert
                    title="Travaux relevant de la sous-section 4"
                    severity="success"
                    description=""
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Worker;
