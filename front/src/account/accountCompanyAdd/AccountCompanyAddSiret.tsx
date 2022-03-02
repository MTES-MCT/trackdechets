import React, { useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import cogoToast from "cogo-toast";
import { COMPANY_INFOS } from "form/common/components/company/query";
import RedErrorMessage from "common/components/RedErrorMessage";
import AutoFormattingCompanyInfosInput from "common/components/AutoFormattingCompanyInfosInput";
import { NotificationError } from "common/components/Error";
import styles from "../AccountCompanyAdd.module.scss";
import { Mutation, Query } from "generated/graphql/types";
import Tooltip from "common/components/Tooltip";
import {
  isFRVat,
  isSiret,
  isVat,
} from "generated/constants/companySearchHelpers";

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
  const [isDisabled, setIsDisabled] = useState(false);

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
          setIsDisabled(!companyInfos?.isRegistered);
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
                "Veuillez nous contacter à l'adresse hello@trackdechets.beta.gouv.fr avec votre certificat d'inscription au répertoire des Entreprises et " +
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
          const isValidSiret = isSiret(values.siret);
          const isValidVat = isVat(values.siret);
          if (!isValidSiret && !/^[a-zA-Z]{2}/.test(values.siret)) {
            return {
              siret: "Vous devez entrer un SIRET de 14 chiffres",
            };
          } else if (!isValidVat && !/^[0-9]{14}$/.test(values.siret)) {
            return {
              siret:
                "Vous devez entrer un numéro de TVA intracommunautaire valide. Veuillez nous contacter à l'adresse hello@trackdechets.beta.gouv.fr avec un justifictif légal du pays d'origine.",
            };
          } else if (isValidVat && isFRVat(values.siret)) {
            return {
              siret:
                "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et non son numéro de TVA",
            };
          }
        }}
        onSubmit={values => {
          // reset company infos
          onCompanyInfos(null);
          searchCompany({
            variables: { siret: values.siret },
          });
        }}
      >
        {({ setFieldValue }) => (
          <Form className={styles.companyAddForm}>
            <div className={styles.field}>
              <label className={`text-right ${styles.bold}`}>
                SIRET ou numéro TVA pour un transporteur de l'UE
              </label>
              <div className={styles.field__value}>
                <Field
                  name="siret"
                  component={AutoFormattingCompanyInfosInput}
                  onChange={e => {
                    setIsRegistered(false);
                    setFieldValue("siret", e.target.value);
                  }}
                  disabled={isDisabled}
                />
                {import.meta.env.VITE_ALLOW_TEST_COMPANY === "true" && (
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
