import { ApolloError, useLazyQuery, useMutation } from "@apollo/client";
import { Field, Form, Formik, useFormikContext } from "formik";
import React, { useEffect, useState } from "react";
import { COMPANY_ACCOUNT_ADD_PRIVATE_INFOS } from "../../../common/queries/company/query";
import AccountCompanyAddMembershipRequest from "./AccountCompanyAddMembershipRequest";
import styles from "../AccountCompanyAdd.module.scss";
import { Mutation, Query } from "@td/codegen-ui";
import {
  isFRVat,
  isSiret,
  isVat,
  isClosedCompany,
  CLOSED_COMPANY_ERROR
} from "@td/constants";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import AccountCompanyAddAnonymousCompany from "./anonymous/AccountCompanyAddAnonymousCompany";
import AccountCompanyAddSiretError from "./AccountCompanyAddSiretError";
import { CREATE_TEST_COMPANY } from "../../common/queries";
import { envConfig } from "../../../../common/envConfig";

type IProps = {
  onCompanyInfos: (companyInfos) => void;
  showIndividualInfo?: boolean;
  onlyForeignVAT?: boolean;
  defaultQuery?: string;
  label?: string;
  hintText?: string;
};

const individualInfo = (
  <div className={styles.alertWrapper}>
    <Alert
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
              className="fr-link force-external-link-content force-underline-link"
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
              className="fr-link force-external-link-content force-underline-link"
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
  hintText = "ou numéro TVA pour un transporteur de l'UE"
}: IProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [nonDiffusibleCompanySiret, setNonDiffusibleCompanySiret] = useState<
    string | null
  >();
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
            companyInfos?.statutDiffusionEtablissement === "P" &&
            !companyInfos?.isAnonymousCompany
          ) {
            setNonDiffusibleCompanySiret(data.companyPrivateInfos.siret);
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
    fetchPolicy: "no-cache"
  });

  const [createTestCompany] =
    useMutation<Pick<Mutation, "createTestCompany">>(CREATE_TEST_COMPANY);

  const shouldAutoSubmit = !isPreloaded && defaultQuery !== "" && !loading;

  return (
    <div className="fr-container-fluid">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <Formik
            initialValues={{ siret: defaultQuery }}
            validate={values => {
              const isValidSiret = isSiret(
                values.siret,
                envConfig.VITE_ALLOW_TEST_COMPANY
              );
              const isValidVat = isVat(values.siret);

              if (onlyForeignVAT) {
                if (!isValidVat) {
                  return {
                    siret:
                      "Vous devez entrer un numéro de TVA intracommunautaire valide. You must use a valid VAT number."
                  };
                }
                if (isValidVat && isFRVat(values.siret)) {
                  return {
                    siret:
                      "Vous devez identifier un établissement français par son SIRET (14 chiffres) et non son numéro de TVA"
                  };
                }
              } else {
                if (!isValidSiret && /^[0-9]{15,}/.test(values.siret)) {
                  return {
                    siret: "Vous devez entrer un SIRET composé de 14 chiffres"
                  };
                }
                if (!isValidSiret && /^[0-9]{14}/.test(values.siret)) {
                  return {
                    siret: "Aucun établissement trouvé avec ce SIRET"
                  };
                }
                if (!isValidSiret && !/^[a-zA-Z]{2}/.test(values.siret)) {
                  return {
                    siret: "Vous devez entrer un SIRET composé de 14 chiffres"
                  };
                }
                if (!isValidSiret && /^[0-9]{9}/.test(values.siret)) {
                  return {
                    siret:
                      "Vous devez entrer un SIRET composé de 14 chiffres, ne pas confondre avec le SIREN"
                  };
                }
                if (!isValidVat && !/^[0-9]{14}$/.test(values.siret)) {
                  return {
                    siret: (
                      <span>
                        {`Vous devez entrer un numéro de TVA intracommunautaire valide. Si vous continuez à rencontrer un souci de création avec votre numéro, veuillez nous partager un justificatif légal du pays d'origine via `}
                        <a
                          href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                          target="_blank"
                          rel="noreferrer"
                          className="fr-link--xs force-external-link-content force-underline-link"
                        >
                          la FAQ
                        </a>
                      </span>
                    )
                  };
                }
                if (isValidVat && isFRVat(values.siret)) {
                  return {
                    siret:
                      "Vous devez identifier un établissement français par son SIRET (14 chiffres) et non son numéro de TVA"
                  };
                }
              }
            }}
            onSubmit={values => {
              // reset company infos
              onCompanyInfos(null);
              searchCompany({
                variables: { clue: values.siret }
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
                          ...field
                        }}
                      />
                    );
                  }}
                </Field>

                {envConfig.VITE_ALLOW_TEST_COMPANY && !onlyForeignVAT && (
                  <Button
                    type="button"
                    priority="tertiary"
                    disabled={loading || isDisabled}
                    title="Génère un SIRET unique permettant la création d'un établissement factice pour la réalisation de vos tests"
                    onClick={() =>
                      createTestCompany().then(response => {
                        setFieldValue(
                          "siret",
                          response.data?.createTestCompany
                        );
                      })
                    }
                  >
                    Obtenir un SIRET factice
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
          {nonDiffusibleCompanySiret && (
            <AccountCompanyAddAnonymousCompany
              siret={nonDiffusibleCompanySiret}
            />
          )}
          {isClosed && closedCompanyError}
          {showIndividualInfo && !isDisabled && individualInfo}

          {error && <AccountCompanyAddSiretError errorMsg={error.message} />}
        </div>
      </div>
    </div>
  );
}
