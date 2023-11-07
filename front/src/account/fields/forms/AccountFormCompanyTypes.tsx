import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Formik, Field, Form, FormikProps } from "formik";
import CompanyTypes from "../../../login/CompanyType";
import RedErrorMessage from "../../../common/components/RedErrorMessage";
import styles from "./AccountForm.module.scss";
import { InlineError } from "../../../Apps/common/Components/Error/Error";
import {
  CompanyPrivate,
  CompanyType,
  Mutation,
  MutationUpdateCompanyArgs
} from "codegen-ui";
import Tooltip from "../../../common/components/Tooltip";
import DateInput from "../../../form/common/components/custom-inputs/DateInput";
import {
  CREATE_WORKER_CERTIFICATION,
  DELETE_WORKER_CERTIFICATION,
  UPDATE_COMPANY_WORKER_CERTIFICATION,
  UPDATE_WORKER_CERTIFICATION
} from "./AccountFormCompanyWorkerCertification";

type Props = {
  name: string;
  company: CompanyPrivate;
  companyTypes: CompanyType[];
  toggleEdition: () => void;
};

type V = {
  companyTypes: CompanyType[];
  worker: {
    hasSubSectionFour: boolean;
    hasSubSectionThree: boolean;
    certificationNumber: string;
    validityLimit: string | null;
    organisation: string;
  };
};

export const UPDATE_COMPANY_TYPES = gql`
  mutation UpdateCompany($id: String!, $companyTypes: [CompanyType!]) {
    updateCompany(id: $id, companyTypes: $companyTypes) {
      id
      companyTypes
    }
  }
`;

export default function AccountFormCompanyTypes({
  name,
  company,
  companyTypes,
  toggleEdition
}: Props) {
  const [isWorkerChecked, setIsWorkerChecked] = useState(false);

  const [updateCompanyTypes, { loading, error }] = useMutation<
    Pick<Mutation, "updateCompany">,
    Pick<MutationUpdateCompanyArgs, "id" | "companyTypes">
  >(UPDATE_COMPANY_TYPES, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const [
    updateCompanyWorker,
    { loading: loadingCompanyWorker, error: errorUpdateCompanyWorker }
  ] = useMutation(UPDATE_COMPANY_WORKER_CERTIFICATION);

  const workerCertification = company.workerCertification;

  const [
    createOrUpdateWorkerCertification,
    {
      loading: loadingCreateOrUpdateCertif,
      error: errorUpdateOrCreateWorkerCertif
    }
  ] = useMutation(
    workerCertification
      ? UPDATE_WORKER_CERTIFICATION
      : CREATE_WORKER_CERTIFICATION
  );

  const [
    deleteWorkerCertification,
    { loading: deleteLoading, error: deleteError }
  ] = useMutation(DELETE_WORKER_CERTIFICATION, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment WorkerCertificationCompanyFragment on CompanyPrivate {
            id
            workerCertification {
              id
            }
          }
        `,
        data: { workerCertification: null }
      });
    }
  });

  const initialValues = {} as V;
  initialValues["companyTypes"] = companyTypes;
  initialValues["worker"] = {
    hasSubSectionFour: workerCertification?.hasSubSectionFour || false,
    hasSubSectionThree: workerCertification?.hasSubSectionThree || false,
    certificationNumber: workerCertification?.certificationNumber || "",
    validityLimit: workerCertification?.validityLimit || null,
    organisation: workerCertification?.organisation || ""
  };

  const handleChange = (e, arrayHelpers, companyType, value) => {
    const isWorker = companyType.value === CompanyType.Worker;
    if (e.target.checked) {
      arrayHelpers.push(companyType.value);

      if (isWorker) {
        setIsWorkerChecked(true);
      }
    } else {
      const idx = value.indexOf(companyType.value);
      arrayHelpers.remove(idx);

      if (isWorker) {
        setIsWorkerChecked(false);
      }
    }
  };

  const handleSubmit = async (values, setFieldError, setSubmitting) => {
    const { companyTypes, worker } = values;

    updateCompanyTypes({
      variables: {
        id: company.id,
        companyTypes
      }
    }).catch(() => {
      setFieldError(name, "Erreur serveur");
      setSubmitting(false);
    });

    if (values.companyTypes.includes(CompanyType.Worker)) {
      const input = {
        ...(workerCertification?.id ? { id: workerCertification.id } : {}),
        hasSubSectionFour: worker.hasSubSectionFour,
        hasSubSectionThree: worker.hasSubSectionThree,
        certificationNumber: worker.certificationNumber,
        validityLimit: worker.validityLimit,
        organisation: worker.organisation
      };

      const { data } = await createOrUpdateWorkerCertification({
        variables: { input }
      });

      if (data.createWorkerCertification) {
        await updateCompanyWorker({
          variables: {
            id: company.id,
            workerCertificationId: data.createWorkerCertification.id
          }
        });
      }
    } else {
      // remove certification from profile
      if (workerCertification?.id) {
        await deleteWorkerCertification({
          variables: {
            input: { id: workerCertification.id }
          }
        });
      }
    }
  };

  const handleValidate = values => {
    const errors = {
      ...(values.worker.hasSubSectionThree &&
        !values.worker.certificationNumber && {
          certificationNumber: "Champ obligatoire"
        }),
      ...(values.worker.hasSubSectionThree &&
        !values.worker.validityLimit && {
          validityLimit: "Champ obligatoire"
        }),
      ...(values.worker.hasSubSectionThree &&
        !values.worker.organisation && {
          organisation: "Champ obligatoire"
        })
    };

    return errors;
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={values => {
        return handleValidate(values);
      }}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        handleSubmit(values, setFieldError, setSubmitting);
      }}
      validateOnChange={false}
    >
      {(props: FormikProps<V>) => (
        <Form>
          <div className="form__row">
            <Field className={styles.input} name={name}>
              {({ field, form, meta }) => {
                return (
                  <CompanyTypes
                    field={field}
                    form={form}
                    meta={meta}
                    label={""}
                    handleChange={handleChange}
                  />
                );
              }}
            </Field>
            {isWorkerChecked && (
              <div className={styles.workerCertif}>
                <div className={styles.workerCertifItem}>
                  <label>Travaux relevant de la sous-section 4</label>
                  <Field
                    type="checkbox"
                    name="worker.hasSubSectionFour"
                    className="td-checkbox"
                  />
                </div>
                <div className={styles.workerCertifItem}>
                  <label>
                    Travaux relevant de la sous-section 3{" "}
                    <Tooltip msg="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)" />
                  </label>
                  <Field
                    type="checkbox"
                    name="worker.hasSubSectionThree"
                    className="td-checkbox"
                  />
                </div>
                <div className={styles.workerCertifItem}>
                  {props.values.worker?.hasSubSectionThree && (
                    <div className={styles.workCertifSubSectionThree}>
                      <div>
                        <label>N° certification</label>
                        <Field
                          type="text"
                          name="worker.certificationNumber"
                          className="td-input"
                        />
                        {props.errors["certificationNumber"] && (
                          <p className="error-message">
                            {props.errors["certificationNumber"]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label>Date de validité</label>
                        <Field
                          name="worker.validityLimit"
                          component={DateInput}
                          className="td-input td-date"
                        />
                        {props.errors["validityLimit"] && (
                          <p className="error-message">
                            {props.errors["validityLimit"]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label>Organisme</label>
                        <Field
                          as="select"
                          name="worker.organisation"
                          className="td-select"
                        >
                          <option value="...">
                            Sélectionnez une valeur...
                          </option>
                          <option value="AFNOR Certification">
                            AFNOR Certification
                          </option>
                          <option value="GLOBAL CERTIFICATION">
                            GLOBAL CERTIFICATION
                          </option>
                          <option value="QUALIBAT">QUALIBAT</option>
                        </Field>
                        {props.errors["organisation"] && (
                          <p className="error-message">
                            {props.errors["organisation"]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {(loading ||
            loadingCompanyWorker ||
            loadingCreateOrUpdateCertif ||
            deleteLoading) && <div>Envoi en cours...</div>}

          {props.errors[name] && (
            <RedErrorMessage name={name}>{props.errors[name]}</RedErrorMessage>
          )}
          {error && <InlineError apolloError={error} />}
          {errorUpdateCompanyWorker && (
            <InlineError apolloError={errorUpdateCompanyWorker} />
          )}
          {errorUpdateOrCreateWorkerCertif && (
            <InlineError apolloError={errorUpdateOrCreateWorkerCertif} />
          )}
          {deleteError && <InlineError apolloError={deleteError} />}

          <button
            className="btn btn--primary"
            type="submit"
            disabled={props.isSubmitting}
          >
            Valider
          </button>
        </Form>
      )}
    </Formik>
  );
}
