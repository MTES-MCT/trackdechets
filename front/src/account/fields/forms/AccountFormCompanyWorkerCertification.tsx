import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Formik, FormikProps, Form, Field } from "formik";
import { NotificationError } from "../../../Apps/common/Components/Error/Error";
import { CompanyPrivate } from "@td/codegen-ui";
import DateInput from "../../../form/common/components/custom-inputs/DateInput";
import Tooltip from "../../../common/components/Tooltip";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "workerCertification">;
  toggleEdition: () => void;
};

type V = {
  hasSubSectionFour: boolean;
  hasSubSectionThree: boolean;
  certificationNumber?: string | null;
  validityLimit?: Date | null;
  organisation?: string | null;
};

export const UPDATE_WORKER_CERTIFICATION = gql`
  mutation UpdateWorkerCertification($input: UpdateWorkerCertificationInput!) {
    updateWorkerCertification(input: $input) {
      id
      hasSubSectionFour
      hasSubSectionThree
      certificationNumber
      validityLimit
      organisation
    }
  }
`;

export const CREATE_WORKER_CERTIFICATION = gql`
  mutation CreateWorkerCertification($input: CreateWorkerCertificationInput!) {
    createWorkerCertification(input: $input) {
      id
      hasSubSectionFour
      hasSubSectionThree
      certificationNumber
      validityLimit
      organisation
    }
  }
`;

export const UPDATE_COMPANY_WORKER_CERTIFICATION = gql`
  mutation UpdateCompany($id: String!, $workerCertificationId: String!) {
    updateCompany(id: $id, workerCertificationId: $workerCertificationId) {
      id
      workerCertification {
        id
        hasSubSectionFour
        hasSubSectionThree
        certificationNumber
        validityLimit
        organisation
      }
    }
  }
`;

export const DELETE_WORKER_CERTIFICATION = gql`
  mutation DeleteWorkerCertification($input: DeleteWorkerCertificationInput!) {
    deleteWorkerCertification(input: $input) {
      id
    }
  }
`;

export default function AccountFormCompanyAddWorkerCertification({
  company,
  toggleEdition
}: Props) {
  const workerCertification = company.workerCertification;

  const [
    createOrUpdateWorkerCertification,
    { loading: updateOrCreateLoading, error: updateOrCreateError }
  ] = useMutation(
    workerCertification
      ? UPDATE_WORKER_CERTIFICATION
      : CREATE_WORKER_CERTIFICATION
  );

  const [
    updateCompany,
    { loading: updateCompanyLoading, error: updateCompanyError }
  ] = useMutation(UPDATE_COMPANY_WORKER_CERTIFICATION);

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

  const initialValues: V = workerCertification
    ? {
        hasSubSectionFour: workerCertification.hasSubSectionFour,
        hasSubSectionThree: workerCertification.hasSubSectionThree,
        certificationNumber: workerCertification.certificationNumber,
        validityLimit: workerCertification.validityLimit
          ? new Date(workerCertification.validityLimit)
          : null,
        organisation: workerCertification.organisation
      }
    : {
        hasSubSectionFour: false,
        hasSubSectionThree: false,
        certificationNumber: "",
        validityLimit: null,
        organisation: ""
      };

  return (
    <>
      {updateOrCreateError && (
        <NotificationError apolloError={updateOrCreateError} />
      )}

      {updateCompanyError && (
        <NotificationError apolloError={updateCompanyError} />
      )}

      {deleteError && <NotificationError apolloError={deleteError} />}
      <Formik
        initialValues={initialValues}
        onSubmit={async values => {
          const input = {
            ...(workerCertification?.id ? { id: workerCertification.id } : {}),
            ...values
          };
          const { data } = await createOrUpdateWorkerCertification({
            variables: { input }
          });
          if (data.createWorkerCertification) {
            await updateCompany({
              variables: {
                id: company.id,
                workerCertificationId: data.createWorkerCertification.id
              }
            });
          }
          toggleEdition();
        }}
      >
        {(props: FormikProps<V>) => (
          <Form>
            <table>
              <tbody>
                <tr>
                  <td>Travaux relevant de la sous-section 4</td>
                  <td>
                    <Field
                      type="checkbox"
                      name="hasSubSectionFour"
                      className="td-checkbox"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    Travaux relevant de la sous-section 3{" "}
                    <Tooltip msg="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)" />
                  </td>
                  <td>
                    <Field
                      type="checkbox"
                      name="hasSubSectionThree"
                      className="td-checkbox"
                    />
                  </td>
                </tr>
                {props.values.hasSubSectionThree && (
                  <>
                    <tr>
                      <td>N° certification</td>
                      <td>
                        <Field
                          type="text"
                          name="certificationNumber"
                          className="td-input"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>Date de validité</td>
                      <td>
                        <Field
                          name="validityLimit"
                          component={DateInput}
                          className="td-input td-date"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>Organisme</td>
                      <td>
                        <Field
                          as="select"
                          name="organisation"
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
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            {(updateOrCreateLoading ||
              deleteLoading ||
              updateCompanyLoading) && <div>Envoi en cours...</div>}
            <div className="tw-mt-2">
              {workerCertification && (
                <button
                  className="btn btn--danger tw-mr-1"
                  type="button"
                  disabled={props.isSubmitting}
                  onClick={async () => {
                    await deleteWorkerCertification({
                      variables: {
                        input: { id: workerCertification.id }
                      }
                    });
                    toggleEdition();
                  }}
                >
                  Supprimer
                </button>
              )}
              <button
                className="btn btn--primary"
                type="submit"
                disabled={props.isSubmitting}
              >
                {workerCertification ? "Modifier" : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
