import React from "react";
import { Formik, Form, FieldArray, Field } from "formik";
import { useMutation, gql } from "@apollo/client";
import { IconTrash } from "../../../common/Components/Icons/Icons";
import { InlineError } from "../../../common/Components/Error/Error";
import styles from "./AccountForm.module.scss";

interface AccountFormAgreementsProps {
  name: string;
  ecoOrganismeAgreements: string[];
  id: string;
  toggleEdition: () => void;
}

const UPDATE_AGREEMENTS = gql`
  mutation UpdateCompanyAgreements(
    $id: String!
    $ecoOrganismeAgreements: [URL!]
  ) {
    updateCompany(id: $id, ecoOrganismeAgreements: $ecoOrganismeAgreements) {
      id
      siret
      ecoOrganismeAgreements
    }
  }
`;

export default function AccountFormAgreements({
  name,
  ecoOrganismeAgreements,
  id,
  toggleEdition
}: AccountFormAgreementsProps) {
  const [updateAgreements, { loading, error }] = useMutation<
    {},
    {
      id: string;
      ecoOrganismeAgreements: string[];
    }
  >(UPDATE_AGREEMENTS);

  return (
    <Formik<{ ecoOrganismeAgreements: string[] }>
      initialValues={{ ecoOrganismeAgreements }}
      onSubmit={async values => {
        await updateAgreements({
          variables: {
            id,
            ecoOrganismeAgreements:
              // Filter out empty inputs
              values.ecoOrganismeAgreements.filter(Boolean)
          }
        });
        toggleEdition();
      }}
    >
      {props => (
        <Form>
          <FieldArray name={name}>
            {({ push, remove }) => (
              <>
                <div className="form__group">
                  {props.values.ecoOrganismeAgreements.map((url, index) => (
                    <div
                      key={index}
                      className={styles.input__group}
                      style={{ alignItems: "normal", marginBottom: "10px" }}
                    >
                      <Field
                        name={`${name}.${index}`}
                        type="url"
                        className="td-input"
                      />

                      <button
                        type="button"
                        className="btn btn--outline-danger"
                        onClick={() => remove(index)}
                        aria-label="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
                {error && <InlineError apolloError={error} />}
                <button
                  className="btn btn--primary"
                  type="button"
                  disabled={loading}
                  onClick={() => push("")}
                >
                  Ajouter un agrément
                </button>
                &nbsp;
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Chargement..." : "Valider"}
                </button>
              </>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
}
