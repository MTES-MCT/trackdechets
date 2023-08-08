import { ApolloError, gql, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { COMPANY_ACCOUNT_ADD_PRIVATE_INFOS } from "Apps/common/queries/company/query";
import AccountCompanyAddMembershipRequest from "./AccountCompanyAddMembershipRequest";
import styles from "../AccountCompanyAdd.module.scss";
import { Mutation, Query } from "generated/graphql/types";
import {
  isFRVat,
  isSiret,
  isVat,
  isClosedCompany,
  CLOSED_COMPANY_ERROR,
} from "generated/constants/companySearchHelpers";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";

type IProps = {
  onCompanyInfos: (companyInfos) => void;
  showIndividualInfo?: Boolean;
  onlyForeignVAT?: Boolean;
  defaultQuery?: string;
  label?: string;
  hintText?: string;
};

const CREATE_TEST_COMPANY = gql`
  mutation CreateTestCompany {
    createTestCompany
  }
`;

const individualInfo = (
  <div className={styles.alertWrapper}>
    <Alert
      closable
      severity="info"
      title="Vous rencontrez des difficultés dans la création d'un établissement ?"
      description="Si vous êtes un particulier, vous n'avez pas à créer d'établissement, ni de compte Trackdéchets."
    />
  </div>
);

const closedCompanyError = (
  <div className={styles.alertWrapper}>
    <Alert
      title="Cet établissement est fermé"
      severity="error"
      description={
        <>
          <p>
            Il ne peut pas être inscrit. Il est possible que votre SIRET ait
            changé.
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
  </div>
);

const nonDiffusibleError = (
  <div className={styles.alertWrapper}>
    <Alert
      title="Etablissement non diffusible"
      severity="error"
      description={
        <>
          <span>
            Nous n'avons pas pu récupérer les informations de cet établissement
            car il n'est pas diffusible. Veuillez nous contacter via{" "}
            <a
              href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
              target="_blank"
              rel="noreferrer"
            >
              la FAQ
            </a>{" "}
            <b>avec</b> votre certificat d'inscription au répertoire des
            Entreprises et des Établissements (SIRENE) pour pouvoir procéder à
            la création de l'établissement. Pour télécharger votre certificat,
            RDV sur{" "}
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
  </div>
);

const AutoSubmitSiret = ({ defaultSiret, didAutoSubmit }) => {
  const { submitForm, values } = useFormikContext<any>();

  useEffect(() => {
    if (defaultSiret === values.siret) {
      submitForm();
      didAutoSubmit();
    }
  }, [didAutoSubmit, submitForm, defaultSiret, values.siret]);

  return null;
};

/**
 * SIRET Formik field for company creation
 * The siret is checked against query { companyInfos }
 * to make sure :
 * - company exists
 * - it is not already registered in TD
 * - it is not closed
 */
export default function AccountCompanyAddSiret({
  onCompanyInfos,
  showIndividualInfo = false,
  onlyForeignVAT = false,
  defaultQuery = "",
  label = "SIRET",
  hintText = "ou numéro TVA pour un transporteur de l'UE",
}: IProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isNonDiffusible, setIsNonDiffusible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const [searchCompany, { loading, error }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">
  >(COMPANY_ACCOUNT_ADD_PRIVATE_INFOS, {
    onCompleted: data => {
      if (data?.companyPrivateInfos) {
        const companyInfos = data.companyPrivateInfos;
        if (!isClosedCompany(companyInfos)) {
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
        } else {
          // This is just a security if we change COMPANY_ACCOUNT_ADD_PRIVATE_INFOS behavior
          // because it must raise an error in this case.
          setIsClosed(true);
        }
      }
    },
    onError: (err: ApolloError) => {
      if (err.graphQLErrors) {
        if (
          err.graphQLErrors.some(
            gqlerr => gqlerr.message.search(CLOSED_COMPANY_ERROR) !== -1
          )
        ) {
          setIsClosed(true);
        }
      }
    },
    fetchPolicy: "no-cache",
  });

  const [createTestCompany] =
    useMutation<Pick<Mutation, "createTestCompany">>(CREATE_TEST_COMPANY);

  const shouldAutoSubmit = !isPreloaded && defaultQuery !== "" && !loading;

  return (
    <div className="fr-container-fluid">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          {error && (
            <Alert
              severity="error"
              title="Erreur"
              description={error.message}
            />
          )}
          <Formik
            initialValues={{ siret: defaultQuery }}
            validate={values => {
              const isValidSiret = isSiret(
                values.siret,
                import.meta.env.VITE_ALLOW_TEST_COMPANY
              );
              const isValidVat = isVat(values.siret);

              if (onlyForeignVAT) {
                if (!isValidVat) {
                  return {
                    siret:
                      "Vous devez entrer un numéro de TVA intracommunautaire valide. You must use a valid VAT number.",
                  };
                }
                if (isValidVat && isFRVat(values.siret)) {
                  return {
                    siret:
                      "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et non son numéro de TVA",
                  };
                }
              } else {
                if (!isValidSiret && /^[0-9]{15,}/.test(values.siret)) {
                  return {
                    siret: "Vous devez entrer un SIRET composé de 14 chiffres",
                  };
                }
                if (!isValidSiret && /^[0-9]{14}/.test(values.siret)) {
                  return {
                    siret: "Aucun établissement trouvé avec ce SIRET",
                  };
                }
                if (!isValidSiret && !/^[a-zA-Z]{2}/.test(values.siret)) {
                  return {
                    siret: "Vous devez entrer un SIRET composé de 14 chiffres",
                  };
                }
                if (!isValidSiret && /^[0-9]{9}/.test(values.siret)) {
                  return {
                    siret:
                      "Vous devez entrer un SIRET composé de 14 chiffres, ne pas confondre avec le SIREN",
                  };
                }
                if (!isValidVat && !/^[0-9]{14}$/.test(values.siret)) {
                  return {
                    siret: `Vous devez entrer un numéro de TVA intracommunautaire valide. Veuillez nous contacter via la FAQ https://faq.trackdechets.fr/pour-aller-plus-loin/assistance avec un justificatif légal du pays d'origine.`,
                  };
                }
                if (isValidVat && isFRVat(values.siret)) {
                  return {
                    siret:
                      "Vous devez identifier un établissement français par son numéro de SIRET (14 chiffres) et non son numéro de TVA",
                  };
                }
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
            {({ setFieldValue, errors, values, handleSubmit }) => (
              <Form onSubmit={handleSubmit} className={styles.companyAddForm}>
                {shouldAutoSubmit && (
                  <AutoSubmitSiret
                    defaultSiret={defaultQuery}
                    didAutoSubmit={() => {
                      setIsPreloaded(true);
                    }}
                  ></AutoSubmitSiret>
                )}
                <Field name="siret">
                  {({ field }) => {
                    return (
                      <Input
                        label={label}
                        hintText={hintText}
                        state={errors.siret ? "error" : "default"}
                        stateRelatedMessage={errors.siret || ""}
                        disabled={isDisabled}
                        nativeInputProps={{
                          // force remove whitespace
                          onKeyUp: (e: React.ChangeEvent<HTMLInputElement>) => {
                            const siret = e.target.value
                              .split(" ")
                              .join("")
                              .toUpperCase();
                            setIsRegistered(false);
                            setFieldValue("siret", siret);
                          },
                          ...field,
                        }}
                      />
                    );
                  }}
                </Field>

                {import.meta.env.VITE_ALLOW_TEST_COMPANY === "true" &&
                  !onlyForeignVAT && (
                    <Button
                      priority="tertiary"
                      disabled={loading || isDisabled}
                      title="Génère un n°SIRET unique permettant la création d'un établissement factice pour la réalisation de vos tests"
                      onClick={() =>
                        createTestCompany().then(response => {
                          setFieldValue(
                            "siret",
                            response.data?.createTestCompany
                          );
                        })
                      }
                    >
                      Obtenir un n° SIRET factice
                    </Button>
                  )}

                {isRegistered && (
                  <AccountCompanyAddMembershipRequest siret={values.siret} />
                )}
                <div className={styles["submit-form"]}>
                  <Button
                    type="submit"
                    disabled={loading || isDisabled || isRegistered}
                  >
                    {loading ? "Chargement..." : "Valider"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
          {isNonDiffusible && nonDiffusibleError}
          {isClosed && closedCompanyError}
          {showIndividualInfo && !isDisabled && individualInfo}
        </div>
      </div>
    </div>
  );
}
