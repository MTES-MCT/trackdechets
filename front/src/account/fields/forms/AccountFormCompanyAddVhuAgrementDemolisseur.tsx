import React from "react";
import { useMutation, gql } from "@apollo/client";
import { Formik, FormikProps, Form, Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { CompanyPrivate } from "generated/graphql/types";

type Props = {
  company: Pick<CompanyPrivate, "id" | "siret" | "vhuAgrementDemolisseur">;
  toggleEdition: () => void;
};

type V = {
  agrementNumber: string;
  department: string;
};

const UPDATE_VHU_AGREMENT = gql`
  mutation UpdateVhuAgrement($input: UpdateVhuAgrementInput!) {
    updateVhuAgrement(input: $input) {
      id
      agrementNumber
      department
    }
  }
`;

const CREATE_VHU_AGREMENT = gql`
  mutation CreateVhuAgrement($input: CreateVhuAgrementInput!) {
    createVhuAgrement(input: $input) {
      id
      agrementNumber
      department
    }
  }
`;

const UPDATE_COMPANY_VHU_AGREMENT = gql`
  mutation UpdateCompany($id: String!, $vhuAgrementDemolisseurId: String!) {
    updateCompany(
      id: $id
      vhuAgrementDemolisseurId: $vhuAgrementDemolisseurId
    ) {
      id
      vhuAgrementDemolisseur {
        id
        agrementNumber
        department
      }
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
export default function AccountFormCompanyAddVhuAgrementDemolisseur({
  company,
  toggleEdition,
}: Props) {
  const vhuAgrementDemolisseur = company.vhuAgrementDemolisseur;

  const [
    createOrUpdateVhuAgrement,
    { loading: updateOrCreateLoading, error: updateOrCreateError },
  ] = useMutation(
    vhuAgrementDemolisseur ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT
  );

  const [
    updateCompany,
    { loading: updateCompanyLoading, error: updateCompanyError },
  ] = useMutation(UPDATE_COMPANY_VHU_AGREMENT);

  const [deleteVhuAgrement, { loading: deleteLoading, error: deleteError }] =
    useMutation(DELETE_VHU_AGREMENT, {
      update(cache) {
        cache.writeFragment({
          id: `CompanyPrivate:${company.id}`,
          fragment: gql`
            fragment VhuAgrementDemolisseurCompanyFragment on CompanyPrivate {
              id
              vhuAgrementDemolisseur {
                id
              }
            }
          `,
          data: { vhuAgrementDemolisseur: null },
        });
      },
    });

  const initialValues: V = vhuAgrementDemolisseur
    ? {
        agrementNumber: vhuAgrementDemolisseur.agrementNumber,
        department: vhuAgrementDemolisseur.department,
      }
    : {
        agrementNumber: "",
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
        onSubmit={async values => {
          const input = {
            ...(vhuAgrementDemolisseur?.id
              ? { id: vhuAgrementDemolisseur.id }
              : {}),
            ...values,
          };
          const { data } = await createOrUpdateVhuAgrement({
            variables: { input },
          });
          if (data.createVhuAgrement) {
            await updateCompany({
              variables: {
                id: company.id,
                vhuAgrementDemolisseurId: data.createVhuAgrement.id,
              },
            });
          }
          toggleEdition();
        }}
        validate={values => {
          return {
            ...(!values.agrementNumber
              ? { agrementNumber: "Champ requis" }
              : {}),
            ...(!values.department ? { department: "Champ requis" } : {}),
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
                      name="agrementNumber"
                      className="td-input"
                    />
                    <RedErrorMessage name="agrementNumber" />
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
              {vhuAgrementDemolisseur && (
                <button
                  className="btn btn--danger tw-mr-1"
                  type="button"
                  disabled={props.isSubmitting}
                  onClick={async () => {
                    await deleteVhuAgrement({
                      variables: {
                        input: { id: vhuAgrementDemolisseur.id },
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
                {vhuAgrementDemolisseur ? "Modifier" : "Créer"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
