import React, { useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import cogoToast from "cogo-toast";
import { COMPANY_INFOS } from "form/common/components/company/query";
import RedErrorMessage from "common/components/RedErrorMessage";
import AutoFormattingSiret from "common/components/AutoFormattingSiret";
import { NotificationError } from "common/components/Error";
import styles from "../AccountCompanyAdd.module.scss";
import { Mutation, Query } from "generated/graphql/types";
import Tooltip from "common/components/Tooltip";

type IProps = {
  onCompanyInfos: (companyInfos) => void;
};

const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

/**
 * SIRET Formik field for company creation
 * The siret is checked against query { companyInfos }
 * to make sure :
 * - company exists
 * - it is not already registered in TD
 * - it is not closed
 */
export default function AccountCompanyAddSiret({ onCompanyInfos }: IProps) {
  const [isRegistered, setIsRegistered] = useState(false);

  const [searchCompany, { loading, error }] = useLazyQuery<
    Pick<Query, "companyInfos">
  >(COMPANY_INFOS, {
    onCompleted: data => {
      if (data && data.companyInfos) {
        const companyInfos = data.companyInfos;
        if (companyInfos.etatAdministratif === "F") {
          cogoToast.error(
            "Cet établissement est fermé, impossible de le créer"
          );
        } else {
          setIsRegistered(companyInfos?.isRegistered ?? false);
          onCompanyInfos(companyInfos);
        }
      }
    },
    fetchPolicy: "no-cache",
  });

  const [createTestCompany] = useMutation<Pick<Mutation, "createTestCompany">>(
    CREATE_TEST_COMPANY
  );

  return (
    <>
      {error && (
        <NotificationError
          apolloError={error}
          message={error => {
            if (
              error.graphQLErrors.length &&
              error.graphQLErrors[0].extensions?.code === "FORBIDDEN"
            ) {
              return (
                "Nous n'avons pas pu récupérer les informations de cet établissement car il n'est pas diffusable. " +
                "Veuillez nous contacter à l'adresse tech@trackdechets.beta.gouv.fr avec votre certificat d'inscription au répertoire des Entreprises et " +
                "des Établissements (SIRENE) pour pouvoir procéder à la création de l'établissement"
              );
            }
            return error.message;
          }}
        />
      )}
      <Formik
        initialValues={{ siret: "" }}
        validate={values => {
          const trimedSiret = values.siret.replace(/\s/g, "");
          if (trimedSiret.length !== 14) {
            return { siret: "Le SIRET doit faire 14 caractères" };
          }
        }}
        onSubmit={values => {
          // reset company infos
          onCompanyInfos(null);
          searchCompany({
            variables: { siret: values.siret.replace(/\s/g, "") },
          });
        }}
      >
        {({ setFieldValue }) => (
          <Form className={styles.companyAddForm}>
            <div className={styles.field}>
              <label className={`text-right ${styles.bold}`}>SIRET</label>
              <div className={styles.field__value}>
                <Field
                  name="siret"
                  component={AutoFormattingSiret}
                  onChange={e => {
                    setIsRegistered(false);
                    setFieldValue("siret", e.target.value);
                  }}
                />
                {process.env.REACT_APP_ALLOW_TEST_COMPANY === "true" && (
                  <button
                    className={`tw-block tw-mt-1 tw-underline ${styles.smaller}`}
                    type="button"
                    onClick={() =>
                      createTestCompany().then(response => {
                        setFieldValue(
                          "siret",
                          response.data?.createTestCompany
                        );
                      })
                    }
                  >
                    Obtenir un n°SIRET factice{" "}
                    <Tooltip msg="Génère un n°SIRET unique permettant la création d'un établissement factice pour la réalisation de vos tests" />
                  </button>
                )}
                {isRegistered && (
                  <p className="error-message">
                    Cet établissement existe déjà dans Trackdéchets
                  </p>
                )}
                <RedErrorMessage name="siret" />
                <div>
                  <button
                    disabled={loading}
                    className="btn btn--primary tw-mt-2"
                    type="submit"
                  >
                    {loading ? "Chargement..." : "Valider"}
                  </button>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
