import React, { useState } from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import { COMPANY_PRIVATE_INFOS } from "form/common/components/company/query";
import RedErrorMessage from "common/components/RedErrorMessage";
import AutoFormattingCompanyInfosInput from "common/components/AutoFormattingCompanyInfosInput";
import {
  NotificationError,
  SimpleNotificationError,
} from "common/components/Error";
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

const closedCompanyError = (
  <SimpleNotificationError
    message={
      <>
        <p>
          Cet établissement est fermé, il ne peut pas être inscrit. Il est
          possible que votre SIRET ait changé.
        </p>
        <p>
          Pour vérifier s'il existe encore, RDV sur{" "}
          <a
            href="https://annuaire-entreprises.data.gouv.fr"
            target="_blank"
            rel="noreferrer"
          >
            https://annuaire-entreprises.data.gouv.fr
          </a>
        </p>
        <p>
          Pour déclarer un changement, RDV sur{" "}
          <a
            href="https://entreprendre.service-public.fr/vosdroits/F31479"
            target="_blank"
            rel="noreferrer"
          >
            https://entreprendre.service-public.fr/vosdroits/F31479
          </a>
        </p>
      </>
    }
  />
);

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
  const [isNonDiffusible, setIsNonDiffusible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const [searchCompany, { loading, error }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_PRIVATE_INFOS, {
    onCompleted: data => {
      if (data && data.companyPrivateInfos) {
        const companyInfos = data.companyPrivateInfos;
        if (companyInfos.etatAdministratif === "F") {
          setIsClosed(true);
        } else {
          // Non-diffusible mais pas encore inscrit en AnonymousCompany
          if (
            companyInfos?.statutDiffusionEtablissement === "N" &&
            !companyInfos?.isAnonymousCompany
          ) {
            setIsNonDiffusible(true);
            onCompanyInfos(null);
          } else {
            onCompanyInfos(companyInfos);
          }
          setIsDisabled(!companyInfos?.isRegistered);
          setIsRegistered(companyInfos?.isRegistered ?? false);
          setIsClosed(false);
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
          message={error => error.message}
        />
      )}
      {isNonDiffusible && (
        // <SimpleNotificationError
        //   message={
        //     "Nous n'avons pas pu récupérer les informations de cet établissement car il n'est pas diffusible. " +
        //     "Veuillez nous contacter à l'adresse contact@trackdechets.beta.gouv.fr avec votre certificat d'inscription au répertoire des Entreprises et " +
        //     "des Établissements (SIRENE) pour pouvoir procéder à la création de l'établissement. " +
        //     "Pour télécharger votre certificat, RDV sur "}
        //   <a
        //     href="https://avis-situation-sirene.insee.fr/"
        //     target="_blank"
        //     rel="noreferrer"
        //   >
        //     https://avis-situation-sirene.insee.fr/
        //   </a>
        //   }
        // />
        <SimpleNotificationError
          message={
            <>
              <span>
                Nous n'avons pas pu récupérer les informations de cet
                établissement car il n'est pas diffusible. Veuillez nous
                contacter à l'adresse hello@trackdechets.beta.gouv.fr avec votre
                certificat d'inscription au répertoire des Entreprises et des
                Établissements (SIRENE) pour pouvoir procéder à la création de
                l'établissement. Pour télécharger votre certificat, RDV sur{" "}
              </span>
              <a
                href="https://avis-situation-sirene.insee.fr/"
                target="_blank"
                rel="noreferrer"
              >
                https://avis-situation-sirene.insee.fr/
              </a>
            </>
          }
        />
      )}
      {isClosed && closedCompanyError}
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
                "Vous devez entrer un numéro de TVA intracommunautaire valide. Veuillez nous contacter à l'adresse contact@trackdechets.beta.gouv.fr avec un justificatif légal du pays d'origine.",
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
            variables: { clue: values.siret },
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
                  component={AutoFormattingCompanyInfosInput}
                  onChange={e => {
                    setIsRegistered(false);
                    setFieldValue("siret", e.target.value);
                  }}
                  disabled={isDisabled}
                />
                <p className="tw-font-bold">
                  ou numéro TVA pour un transporteur de l'UE
                </p>
                {import.meta.env.VITE_ALLOW_TEST_COMPANY === "true" && (
                  <div className="tw-flex">
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
                    </button>
                    <Tooltip msg="Génère un n°SIRET unique permettant la création d'un établissement factice pour la réalisation de vos tests" />
                  </div>
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
