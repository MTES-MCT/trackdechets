import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Formik, FormikProps, Form, Field } from "formik";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import { NotificationError } from "../../../common/Components/Error/Error";
import DateInput from "../../../../form/common/components/custom-inputs/DateInput";
import { CompanyPrivate } from "@td/codegen-ui";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "brokerReceipt">;
  toggleEdition: () => void;
};

type V = {
  receiptNumber: string;
  validityLimit: string;
  department: string;
};

const UPDATE_BROKER_RECEIPT = gql`
  mutation UpdateBrokerReceipt($input: UpdateBrokerReceiptInput!) {
    updateBrokerReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

const CREATE_BROKER_RECEIPT = gql`
  mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!) {
    createBrokerReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_COMPANY_BROKER_RECEIPT = gql`
  mutation UpdateCompany($id: String!, $brokerReceiptId: String!) {
    updateCompany(id: $id, brokerReceiptId: $brokerReceiptId) {
      id
      brokerReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const DELETE_BROKER_RECEIPT = gql`
  mutation DeleteBrokerReceipt($input: DeleteBrokerReceiptInput!) {
    deleteBrokerReceipt(input: $input) {
      id
    }
  }
`;

/**
 * This component allows to create / edit / delete a broker receipt
 * @param param0
 */
export default function AccountFormCompanyTransporterReceipt({
  company,
  toggleEdition
}: Props) {
  const brokerReceipt = company.brokerReceipt;

  const [
    createOrUpdateBrokerReceipt,
    { loading: updateOrCreateLoading, error: updateOrCreateError }
  ] = useMutation(
    brokerReceipt ? UPDATE_BROKER_RECEIPT : CREATE_BROKER_RECEIPT
  );

  const [
    updateCompany,
    { loading: updateCompanyLoading, error: updateCompanyError }
  ] = useMutation(UPDATE_COMPANY_BROKER_RECEIPT);

  const [deleteBrokerReceipt, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_BROKER_RECEIPT, {
      update(cache) {
        cache.writeFragment({
          id: `CompanyPrivate:${company.id}`,
          fragment: gql`
            fragment BrokerReceiptCompanyFragment on CompanyPrivate {
              brokerReceipt {
                id
              }
            }
          `,
          data: { brokerReceipt: null }
        });
      }
    });

  const initialValues: V = brokerReceipt
    ? {
        receiptNumber: brokerReceipt.receiptNumber,
        validityLimit: brokerReceipt.validityLimit,
        department: brokerReceipt.department
      }
    : {
        receiptNumber: "",
        validityLimit: new Date().toISOString(),
        department: ""
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
            ...(brokerReceipt?.id ? { id: brokerReceipt.id } : {}),
            ...values
          };
          const { data } = await createOrUpdateBrokerReceipt({
            variables: { input }
          });
          if (data.createBrokerReceipt) {
            await updateCompany({
              variables: {
                id: company.id,
                brokerReceiptId: data.createBrokerReceipt.id
              }
            });
          }
          toggleEdition();
        }}
        validate={values => {
          return {
            ...(!values.receiptNumber ? { receiptNumber: "Champ requis" } : {}),
            ...(!values.validityLimit ? { validityLimit: "Champ requis" } : {}),
            ...(!values.department ? { department: "Champ requis" } : {})
          };
        }}
      >
        {(props: FormikProps<V>) => (
          <Form>
            <table>
              <tbody>
                <tr>
                  <td>Numéro de récépissé</td>
                  <td>
                    <Field
                      type="text"
                      name="receiptNumber"
                      className="td-input"
                    />
                    <RedErrorMessage name="receiptNumber" />
                  </td>
                </tr>
                <tr>
                  <td>Limite de validité</td>
                  <td>
                    <Field
                      name="validityLimit"
                      component={DateInput}
                      className="td-input"
                    />
                    <RedErrorMessage name="validityLimit" />
                  </td>
                </tr>
                <tr>
                  <td>Département</td>
                  <td>
                    <Field
                      type="text"
                      name="department"
                      placeholder="75"
                      className="td-input"
                    />
                    <RedErrorMessage name="department" />
                  </td>
                </tr>
              </tbody>
            </table>
            {(updateOrCreateLoading ||
              deleteLoading ||
              updateCompanyLoading) && <div>Envoi en cours...</div>}

            <div className="tw-mt-2">
              {brokerReceipt && (
                <button
                  className="btn btn--danger tw-mr-1"
                  type="button"
                  disabled={props.isSubmitting}
                  onClick={async () => {
                    await deleteBrokerReceipt({
                      variables: {
                        input: { id: brokerReceipt.id }
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
                {brokerReceipt ? "Modifier" : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
