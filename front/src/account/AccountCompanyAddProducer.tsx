import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { useHistory } from "react-router-dom";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import AccountCompanyAddSiret from "./accountCompanyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";
import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult,
} from "generated/graphql/types";
import { isSiret, isVat } from "generated/constants/companySearchHelpers";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

import {
  CREATE_COMPANY,
  CREATE_COMPANY_HOOK_OPTIONS,
} from "./AccountCompanyAdd";

interface Values extends FormikValues {
  siret: string;
  vatNumber: string;
  companyName: string;
  givenName: string;
  address: string;
  companyTypes: _CompanyType[];
  codeNaf: string;
  isAllowed: boolean;
  willManageDasris: boolean;
}

/**
 * This component allows to create a producer-lony company and make
 * the logged in user admin of it
 */
export default function AccountCompanyAddProducer() {
  const history = useHistory();

  // STATE
  const [companyInfos, setCompanyInfos] = useState<CompanySearchResult | null>(
    null
  );

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, CREATE_COMPANY_HOOK_OPTIONS(history));

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: Values) {
    const { isAllowed, willManageDasris, ...companyValues } = values;

    return createCompany({
      variables: {
        companyInput: {
          ...companyValues,
          allowBsdasriTakeOverWithoutSignature: willManageDasris,
        },
      },
    });
  }

  return (
    <div className={`fr-container-fluid ${styles.container}`}>
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <AccountCompanyAddSiret
            showIndividualInfo
            {...{
              onCompanyInfos: companyInfos => setCompanyInfos(companyInfos),
            }}
          />
        </div>
      </div>
      {companyInfos && !companyInfos.isRegistered && (
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <Formik<Values>
              initialValues={{
                siret: companyInfos?.siret ?? "",
                vatNumber: companyInfos?.vatNumber ?? "",
                companyName: companyInfos?.name ?? "",
                companyTypes: [_CompanyType.Producer],
                givenName: "",
                address: companyInfos?.address ?? "",
                codeNaf: companyInfos?.naf ?? "",
                isAllowed: false,
                willManageDasris: false,
              }}
              validate={values => {
                return {
                  ...(!values.isAllowed && {
                    isAllowed:
                      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise",
                  }),
                  ...(!isSiret(
                    values.siret,
                    import.meta.env.VITE_ALLOW_TEST_COMPANY
                  ) &&
                    !isVat(values.vatNumber) && {
                      siret:
                        "Le SIRET ou le numéro de TVA intracommunautaire doit être valides. (seuls les caractères alphanumériques sont acceptés, pas d'espaces ni de signes de ponctuation)",
                    }),
                };
              }}
              onSubmit={onSubmit}
            >
              {({ isSubmitting, errors, touched, setFieldValue }) => (
                <Form className={styles.companyAddForm}>
                  <Field name="givenName">
                    {({ field }) => {
                      return (
                        <Input
                          label="Nom usuel"
                          hintText="Optionnel"
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  {companyInfos?.name ? (
                    <div className={styles.field}>
                      <label>Raison sociale</label>

                      <div className={styles.field__value}>
                        {companyInfos?.name}
                      </div>
                    </div>
                  ) : (
                    <Field name="companyName">
                      {({ field }) => {
                        return (
                          <Input
                            label="Raison sociale"
                            nativeInputProps={field}
                          ></Input>
                        );
                      }}
                    </Field>
                  )}

                  {companyInfos?.naf ? (
                    <div className={styles.field}>
                      <label>Code NAF</label>

                      <div className={styles.field__value}>
                        {`${companyInfos?.naf} - ${companyInfos?.libelleNaf}`}
                      </div>
                    </div>
                  ) : (
                    <Field name="codeNaf">
                      {({ field }) => {
                        return (
                          <Input
                            label="Code NAF"
                            nativeInputProps={field}
                          ></Input>
                        );
                      }}
                    </Field>
                  )}

                  {companyInfos?.address ? (
                    <div className={styles.field}>
                      <label>Adresse</label>

                      <div className={styles.field__value}>
                        {companyInfos?.address}
                      </div>
                    </div>
                  ) : (
                    <Field name="address">
                      {({ field }) => {
                        return (
                          <Input
                            label="Adresse"
                            disabled={!!companyInfos?.address}
                            nativeInputProps={field}
                          ></Input>
                        );
                      }}
                    </Field>
                  )}

                  <div className={styles.alertWrapper}>
                    <Alert
                      severity="info"
                      title="Information"
                      description={
                        <>
                          Ce profil comprend le transport de mes déchets selon
                          les dispositions de{" "}
                          <a
                            href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044266537/"
                            target="_blank"
                            rel="noreferrer"
                            className="fr-link"
                          >
                            l'article R.541-50 du code de l'environnement
                          </a>
                          .
                        </>
                      }
                    />
                  </div>

                  <Field name="willManageDasris">
                    {({ field }) => {
                      return (
                        <ToggleSwitch
                          onChange={e => {
                            setFieldValue(field.name, e);
                          }}
                          inputTitle={field.name}
                          label="Mon établissement produit des DASRI. Je dispose d'une convention avec un collecteur et j'accepte que ce collecteur prenne en charge mes DASRI sans ma signature lors de la collecte si je ne suis pas disponible. Ce choix est modifiable utérieurement."
                          helperText="(DASRI, Déchets d'Acivité de Soins à Risques Infectieux, par exemple les boîtes et les containers jaunes pour les seringues.)"
                        />
                      );
                    }}
                  </Field>

                  <div className={styles.separator} />

                  <div className={styles.alertWrapper}>
                    <Alert
                      severity="info"
                      title="Information"
                      description={
                        <>
                          En tant qu'administrateur de l'établissement, j'ai
                          pris connaissance des{" "}
                          <a
                            href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte"
                            target="_blank"
                            rel="noreferrer"
                          >
                            modalités de gestion des membres
                          </a>
                          .<br />
                          Je m'engage notamment à traiter les éventuelles
                          demandes de rattachement et à ce que, à tout moment,
                          au moins un administrateur ait accès à cet
                          établissement dans Trackdéchets.
                        </>
                      }
                    />
                  </div>

                  <Field name="isAllowed">
                    {({ field }) => {
                      return (
                        <Checkbox
                          state={
                            errors.isAllowed && touched.isAllowed
                              ? "error"
                              : "default"
                          }
                          stateRelatedMessage={
                            errors.isAllowed && touched.isAllowed
                              ? errors.isAllowed
                              : ""
                          }
                          options={[
                            {
                              label:
                                "Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise.",
                              nativeInputProps: {
                                name: field.name,
                                checked: field.value,
                                onChange: field.onChange,
                                onBlur: field.onBlur,
                              },
                            },
                          ]}
                        />
                      );
                    }}
                  </Field>

                  <div className={styles["submit-form"]}>
                    <Button
                      priority="tertiary"
                      disabled={isSubmitting}
                      onClick={() => {
                        history.goBack();
                      }}
                      nativeButtonProps={{ type: "button" }}
                    >
                      Annuler
                    </Button>

                    <Button
                      nativeButtonProps={{ type: "submit" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Création..." : "Créer"}
                    </Button>
                  </div>
                  {savingError && (
                    <NotificationError apolloError={savingError} />
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
}
