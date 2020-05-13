import React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { Formik, FormikProps, Form, Field } from "formik";
import RedErrorMessage from "../../../common/RedErrorMessage";
import { Company } from "../../AccountCompany";
import { NotificationError } from "../../../common/Error";
import DateInput from "../../../common/DateInput";

type Props = {
  company: Pick<Company, "id" | "siret" | "traderReceipt">;
  toggleEdition: () => void;
};

type V = {
  receiptNumber: string;
  validityLimit: string;
  department: string;
};

const UPDATE_TRADER_RECEIPT = gql`
  mutation UpdateTraderReceipt($input: UpdateTraderReceiptInput!) {
    updateTraderReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

const CREATE_TRADER_RECEIPT = gql`
  mutation CreateTraderReceipt($input: CreateTraderReceiptInput!) {
    createTraderReceipt(input: $input) {
      id
      receiptNumber
      validityLimit
      department
    }
  }
`;

export const UPDATE_COMPANY_TRADER_RECEIPT = gql`
  mutation UpdateCompany($siret: String!, $traderReceiptId: String!) {
    updateCompany(siret: $siret, traderReceiptId: $traderReceiptId) {
      id
      traderReceipt {
        id
        receiptNumber
        validityLimit
        department
      }
    }
  }
`;

export const DELETE_TRADER_RECEIPT = gql`
  mutation DeleteTraderReceipt($input: DeleteTraderReceiptInput!) {
    deleteTraderReceipt(input: $input) {
      id
    }
  }
`;

/**
 * This component allows to create / edit / delete a trader receipt
 * @param param0
 */
export default function AccountFormCompanyTransporterReceipt({
  company,
  toggleEdition,
}: Props) {
  const traderReceipt = company.traderReceipt;

  const [
    createOrUpdateTraderReceipt,
    { loading: updateOrCreateLoading, error: updateOrCreateError },
  ] = useMutation(
    traderReceipt ? UPDATE_TRADER_RECEIPT : CREATE_TRADER_RECEIPT
  );

  const [
    updateCompany,
    { loading: updateCompanyLoading, error: updateCompanyError },
  ] = useMutation(UPDATE_COMPANY_TRADER_RECEIPT);

  const [
    deleteTraderReceipt,
    { loading: deleteLoading, error: deleteError },
  ] = useMutation(DELETE_TRADER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: company.id,
        fragment: gql`
          fragment TraderReceiptCompanyFragment on CompanyPrivate {
            id
            traderReceipt {
              id
            }
          }
        `,
        data: { traderReceipt: null, __typename: "CompanyPrivate" },
      });
    },
  });

  const initialValues: V = traderReceipt
    ? {
        receiptNumber: traderReceipt.receiptNumber,
        validityLimit: traderReceipt.validityLimit,
        department: traderReceipt.department,
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
            ...(traderReceipt?.id ? { id: traderReceipt.id } : {}),
            ...values,
          };
          const { data } = await createOrUpdateTraderReceipt({
            variables: { input },
          });
          if (data.createTraderReceipt) {
            await updateCompany({
              variables: {
                siret: company.siret,
                traderReceiptId: data.createTraderReceipt.id,
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
            {traderReceipt && (
              <button
                className="button warning"
                type="button"
                disabled={props.isSubmitting}
                onClick={async () => {
                  await deleteTraderReceipt({
                    variables: {
                      input: { id: traderReceipt.id },
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
              {traderReceipt ? "Modifier" : "Créer"}
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
}
