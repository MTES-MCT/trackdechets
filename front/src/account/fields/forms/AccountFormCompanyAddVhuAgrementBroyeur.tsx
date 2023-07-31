import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Formik, FormikProps, Form, Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { CompanyPrivate } from "generated/graphql/types";

type Props = {
  company: Pick<
    CompanyPrivate,
    | "id"
    | "siret"
    | "orgId"
    | "vhuAgrementBroyeurNumber"
    | "vhuAgrementBroyeurDepartment"
  >;
  toggleEdition: () => void;
};

type V = {
  vhuAgrementBroyeurNumber: string;
  vhuAgrementBroyeurDepartment: string;
};

const UPDATE_VHU_AGREMENT = gql`
  mutation UpdateVhuAgrement($input: UpdateVhuAgrementInput!) {
    updateVhuAgrement(input: $input) {
      id
      vhuAgrementBroyeurNumber
      vhuAgrementBroyeurDepartment
    }
  }
`;

const CREATE_VHU_AGREMENT = gql`
  mutation CreateVhuAgrement($input: CreateVhuAgrementInput!) {
    createVhuAgrement(input: $input) {
      id
      vhuAgrementBroyeurNumber
      vhuAgrementBroyeurDepartment
    }
  }
`;

const DELETE_VHU_AGREMENT = gql`
  mutation DeleteVhuAgrement($input: DeleteVhuAgrementInput!) {
    deleteVhuAgrement(input: $input) {
      id
    }
  }
`;

/**
 * This component allows to create / edit / delete a VhuAgrement
 * @param param0
 */
export default function AccountFormCompanyAddVhuAgrementBroyeur({
  company,
  toggleEdition,
}: Props) {
  const vhuAgrementBroyeurNumber = company.vhuAgrementBroyeurNumber;

  const [
    createOrUpdateVhuAgrement,
    { loading: updateOrCreateLoading, error: updateOrCreateError },
  ] = useMutation(
    vhuAgrementBroyeurNumber ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT
  );

  const [deleteVhuAgrement, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_VHU_AGREMENT, {
      update(cache) {
        cache.writeFragment({
          id: `CompanyPrivate:${company.id}`,
          fragment: gql`
            fragment VhuAgrementBroyeurCompanyFragment on CompanyPrivate {
              id
              vhuAgrementBroyeurNumber
            }
          `,
          data: { id: company.orgId },
        });
      },
    });

  const initialValues: V = vhuAgrementBroyeurNumber
    ? {
        vhuAgrementBroyeurNumber,
        vhuAgrementBroyeurDepartment,
      }
    : {
        vhuAgrementBroyeurNumber: "",
        vhuAgrementBroyeurDepartment: "",
      };

  return (
    <>
      {updateOrCreateError && (
        <NotificationError apolloError={updateOrCreateError} />
      )}

      {deleteError && <NotificationError apolloError={deleteError} />}
      <Formik
        initialValues={initialValues}
        onSubmit={async values => {
          const input = {
            ...(vhuAgrementBroyeurNumber ? { id: company.orgId } : {}),
            ...values,
          };
          const { data } = await createOrUpdateVhuAgrement({
            variables: { input },
          });
          toggleEdition();
        }}
        validate={values => {
          return {
            ...(!values.vhuAgrementBroyeurNumber
              ? { vhuAgrementBroyeurNumber: "Champ requis" }
              : {}),
            ...(!values.vhuAgrementBroyeurDepartment
              ? { vhuAgrementBroyeurDepartment: "Champ requis" }
              : {}),
          };
        }}
      >
        {(props: FormikProps<V>) => (
          <Form>
            <table>
              <tbody>
                <tr>
                  <td>Numéro</td>
                  <td>
                    <Field
                      type="text"
                      name="vhuAgrementBroyeurNumber"
                      className="td-input"
                    />
                    <RedErrorMessage name="vhuAgrementBroyeurNumber" />
                  </td>
                </tr>
                <tr>
                  <td>Département</td>
                  <td>
                    <Field
                      type="text"
                      name="vhuAgrementBroyeurDepartment"
                      placeholder="75"
                      className="td-input"
                    />
                    <RedErrorMessage name="vhuAgrementBroyeurDepartment" />
                  </td>
                </tr>
              </tbody>
            </table>
            {(updateOrCreateLoading || deleteLoading) && (
              <div>Envoi en cours...</div>
            )}
            <div className="tw-mt-2">
              {vhuAgrementBroyeurNumber && (
                <button
                  className="btn btn--danger tw-mr-1"
                  type="button"
                  disabled={props.isSubmitting}
                  onClick={async () => {
                    await deleteVhuAgrement({
                      variables: {
                        input: { id: company.orgId },
                      },
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
                {vhuAgrementBroyeurNumber ? "Modifier" : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
