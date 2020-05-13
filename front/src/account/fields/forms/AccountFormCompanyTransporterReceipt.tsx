import React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { Formik, FormikProps, Form, Field } from "formik";
import RedErrorMessage from "../../../common/RedErrorMessage";
import { Company } from "../../AccountCompany";
import { NotificationError } from "../../../common/Error";
import DateInput from "../../../common/DateInput";

type Props = {
  company: Pick<Company, "id" | "siret" | "transporterReceipt">;
  toggleEdition: () => void;
};

type V = {
  receiptNumber: string;
  validityLimit: string;
  department: string;
};

const UPDATE_TRANSPORTER_RECEIPT = gql`
  mutation UpdateTransporterReceipt($input: UpdateTransporterReceiptInput!) {
    updateTransporterReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

const CREATE_TRANSPORTER_RECEIPT = gql`
  mutation CreateTransporterReceipt($input: CreateTransporterReceiptInput!) {
    createTransporterReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_COMPANY_TRANSPORTER_RECEIPT = gql`
  mutation UpdateCompany($siret: String!, $transporterReceiptId: String!) {
    updateCompany(siret: $siret, transporterReceiptId: $transporterReceiptId) {
      id
      transporterReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const DELETE_TRANSPORTER_RECEIPT = gql`
  mutation DeleteTransporterReceipt($input: DeleteTransporterReceiptInput!) {
    deleteTransporterReceipt(input: $input) {
      id
    }
  }
`;

/**
 * This component allows to create / edit / delete a transporter receipt
 * @param param0
 */
export default function AccountFormCompanyTransporterReceipt({
  company,
  toggleEdition,
}: Props) {
  const transporterReceipt = company.transporterReceipt;

  const [
    createOrUpdateTransporterReceipt,
    { loading: updateOrCreateLoading, error: updateOrCreateError },
  ] = useMutation(
    transporterReceipt ? UPDATE_TRANSPORTER_RECEIPT : CREATE_TRANSPORTER_RECEIPT
  );

  const [
    updateCompany,
    { loading: updateCompanyLoading, error: updateCompanyError },
  ] = useMutation(UPDATE_COMPANY_TRANSPORTER_RECEIPT);

  const [
    deleteTransporterReceipt,
    { loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_TRANSPORTER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: company.id,
        fragment: gql`
          fragment TransporterReceiptCompanyFragment on CompanyPrivate {
            id
            transporterReceipt {
              id
            }
          }
        `,
        data: { transporterReceipt: null, __typename: "CompanyPrivate" },
      });
    },
  });

  const initialValues: V = transporterReceipt
    ? {
        receiptNumber: transporterReceipt.receiptNumber,
        validityLimit: transporterReceipt.validityLimit,
        department: transporterReceipt.department,
      }
    : {
        receiptNumber: "",
        validityLimit: "",
        department: "",
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
        onSubmit={async (values) => {
          const input = {
            ...(transporterReceipt?.id ? { id: transporterReceipt.id } : {}),
            ...values,
          };
          const { data } = await createOrUpdateTransporterReceipt({
            variables: { input },
          });
          if (data.createTransporterReceipt) {
            await updateCompany({
              variables: {
                siret: company.siret,
                transporterReceiptId: data.createTransporterReceipt.id,
              },
            });
          }
          toggleEdition();
        }}
        validate={(values) => {
          return {
            ...(!values.receiptNumber ? { receiptNumber: "Champ requis" } : {}),
            ...(!values.validityLimit ? { validityLimit: "Champ requis" } : {}),
            ...(!values.department ? { department: "Champ requis" } : {}),
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
                    <Field type="text" name="receiptNumber" />
                    <RedErrorMessage name="receiptNumber" />
                  </td>
                </tr>
                <tr>
                  <td>Limite de validité</td>
                  <td>
                    <Field name="validityLimit" component={DateInput} />
                    <RedErrorMessage name="validityLimit" />
                  </td>
                </tr>
                <tr>
                  <td>Département</td>
                  <td>
                    <Field type="text" name="department" placeholder="75" />
                    <RedErrorMessage name="department" />
                  </td>
                </tr>
              </tbody>
            </table>
            {(updateOrCreateLoading ||
              deleteLoading ||
              updateCompanyLoading) && <div>Envoi en cours...</div>}
            {transporterReceipt && (
              <button
                className="button warning"
                type="button"
                disabled={props.isSubmitting}
                onClick={async () => {
                  await deleteTransporterReceipt({
                    variables: {
                      input: { id: transporterReceipt.id },
                    },
                  });
                  toggleEdition();
                }}
              >
                Supprimer
              </button>
            )}
            <button
              className="button"
              type="submit"
              disabled={props.isSubmitting}
            >
              {transporterReceipt ? "Modifier" : "Créer"}
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
}
