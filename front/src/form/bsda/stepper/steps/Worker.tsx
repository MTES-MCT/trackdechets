import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { formatDate } from "common/datetime";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, useFormikContext } from "formik";
import {
  Bsda,
  BsdaType,
  CompanyType,
  Maybe,
  Query,
  QuerySearchCompaniesArgs,
  WorkerCertification,
} from "generated/graphql/types";
import React, { useEffect, useState } from "react";
import { WORKER_CERTIFICATION } from "Apps/common/queries/company/query";
import { useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

export function Worker({ disabled }) {
  const { setFieldValue, values, handleChange } = useFormikContext<Bsda>();
  const [companyTypes, setCompanyTypes] = useState<CompanyType[] | undefined>();

  const isGroupement = values?.type === BsdaType.Gathering;
  const isEntreposageProvisoire = values?.type === BsdaType.Reshipment;
  const isDechetterie = values?.type === BsdaType.Collection_2710;
  const [workerCertification, setWorkerCertification] =
    useState<Maybe<WorkerCertification>>();
  const { siret: currentSiret } = useParams<{ siret: string }>();
  const [siret, setSelectedSiret] = useState<Maybe<string> | undefined>(
    currentSiret
  );

  const { data } = useQuery<
    Pick<Query, "searchCompanies">,
    QuerySearchCompaniesArgs
  >(WORKER_CERTIFICATION, {
    variables: {
      clue: siret as string,
    },
    fetchPolicy: "no-cache",
  });
  useEffect(() => {
    if (!companyTypes?.includes(CompanyType.Worker)) {
      setWorkerCertification(null);
    }
  }, [companyTypes]);

  useEffect(() => {
    setWorkerCertification(data?.searchCompanies[0]?.workerCertification);
  }, [data?.searchCompanies]);

  useEffect(() => {
    setWorkerCertification(data?.searchCompanies[0]?.workerCertification);
  }, [siret, data?.searchCompanies]);

  const hasCertification =
    values.worker &&
    (values.worker.certification?.hasSubSectionThree ||
      values.worker.certification?.hasSubSectionFour);
  const isWorker =
    hasCertification || companyTypes?.includes(CompanyType.Worker);

  if (isGroupement || isEntreposageProvisoire || isDechetterie) {
    return (
      <div className="notification">
        Vous effectuez un groupement, une réexpédition ou une collecte en
        déchetterie. Il n'y a pas d'entreprise de travaux à saisir.
      </div>
    );
  }

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs grisés ci-dessous ont été scellés via signature et ne sont
          plus modifiables.
        </div>
      )}

      <div className="form__row">
        <label>
          <Field
            disabled={disabled}
            type="checkbox"
            name="worker.isDisabled"
            className="td-checkbox"
            onChange={e => {
              handleChange(e);
              setFieldValue("worker.company.name", null);
              setFieldValue("worker.company.siret", null);
              setFieldValue("worker.company.contact", null);
              setFieldValue("worker.company.address", null);
              setFieldValue("worker.company.mail", null);
              setFieldValue("worker.company.phone", null);
            }}
          />
          Il n'y a pas d'entreprise de travaux
        </label>
      </div>

      {!Boolean(values?.worker?.isDisabled) && (
        <>
          <CompanySelector
            disabled={disabled}
            name="worker.company"
            heading="Entreprise de travaux"
            onCompanySelected={worker => {
              setCompanyTypes(worker?.companyTypes ?? []);
              setSelectedSiret(worker?.siret);
            }}
          />

          <h4 className="form__section-heading">
            Catégorie entreprise de travaux déclarée dans le profil entreprise
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
              {!workerCertification?.hasSubSectionFour &&
                !workerCertification?.hasSubSectionThree && (
                  <Alert
                    title={"L'entreprise n'a pas complété son profil"}
                    severity="warning"
                    description="L'entreprise que vous renseignez s'est enregistrée avec un profil d'entreprise de travaux amiante mais n'a pas complété la catégorie de travaux dans son compte établissement de Trackdéchets. Il appartient à cette entreprise de compléter ses informations."
                  />
                )}
            </div>
          )}

          <div className="form__row">
            {workerCertification?.hasSubSectionFour && (
              <>
                <p>
                  SS4 <span aria-hidden> ✅</span>
                </p>
              </>
            )}
          </div>

          <div className="form__row">
            {workerCertification?.hasSubSectionThree && (
              <>
                <p>
                  SS3 <span aria-hidden> ✅</span> numéro:{" "}
                  {workerCertification?.certificationNumber} date de validité:{" "}
                  {formatDate(workerCertification?.validityLimit!)}
                  {" - "}
                  organisme: {workerCertification?.organisation}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
