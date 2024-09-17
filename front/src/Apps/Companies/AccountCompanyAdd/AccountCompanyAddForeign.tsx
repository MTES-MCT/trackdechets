import React, { useState, useMemo } from "react";
import { useMutation } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { NotificationError } from "../../common/Components/Error/Error";
import AccountCompanyAddSiret from "./companyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";
import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult
} from "@td/codegen-ui";
import { CREATE_COMPANY_HOOK_OPTIONS } from "./AccountCompanyAdd";
import { isSiret, isVat } from "@td/constants";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { CREATE_COMPANY } from "../common/queries";

interface Values extends FormikValues {
  vatNumber: string;
  companyName: string;
  contact: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  companyTypes: _CompanyType[];
  isAllowed: boolean;
}

enum Language {
  FR = "fr",
  EN = "en"
}

const localizedStrings = {
  en: {
    translateButton: "Traduire en français 🇫🇷",
    vatNumber: {
      label: "Intra-community VAT number",
      hint: "Example: BE1234567890",
      error: "Intra-community VAT number must be valid"
    },
    companyName: "Company name",
    address: "Address",
    contact: "Contact name",
    contactEmail: "Contact email",
    contactPhone: {
      label: "Contact phone",
      hint: "Example: +3212234567"
    },
    isAllowed: {
      label:
        "I hereby certify that I have the authority to create an account in the name of my company.",
      error:
        "You must certify that you have the authority to create the account in the name of your company",
      disclaimer: (
        <>
          As the administrator of this company, I understand I will have to{" "}
          <a
            href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte"
            target="_blank"
            rel="noreferrer"
          >
            manage its members in Trackdéchets
          </a>
          .<br />
          In particular, I commit to processing user requests to join the
          company, and to ensure that, at all times, at least one administrator
          is available to manage this company on Trackdéchets.
        </>
      )
    },
    submit: {
      submitting: "Creating...",
      label: "Create"
    },
    cancel: "Cancel"
  },
  fr: {
    translateButton: "Translate in English 🇬🇧",
    vatNumber: {
      label: "N° de TVA intracommunautaire",
      hint: "Exemple : BE1234567890",
      error: "Le N° de TVA intracommunautaire doit être valide."
    },
    companyName: "Nom de l'entreprise",
    address: "Adresse",
    contact: "Nom du responsable",
    contactEmail: "Mail de la personne responsable",
    contactPhone: {
      label: "Téléphone",
      hint: "Exemple : +3212234567"
    },
    isAllowed: {
      label:
        "Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise.",
      error:
        "Vous devez certifier être autorisé à créer ce compte pour votre entreprise",
      disclaimer: (
        <>
          En tant qu'administrateur de l'établissement, j'ai pris connaissance
          des{" "}
          <a
            className="fr-link"
            href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/inviter-des-personnes-a-rejoindre-mon-etablissement"
            target="_blank"
            rel="noreferrer"
          >
            modalités de gestion des membres
          </a>
          .<br />
          Je m'engage notamment à traiter les éventuelles demandes de
          rattachement et à ce que, à tout moment, au moins un administrateur
          ait accès à cet établissement dans Trackdéchets.
        </>
      )
    },
    submit: {
      submitting: "Création...",
      label: "Créer"
    },
    cancel: "Annuler"
  }
};

/**
 * This component allows to create a producer-lony company and make
 * the logged in user admin of it
 */
export default function AccountCompanyAddForeign() {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultVatNumber = location.state?.vatNumber;

  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.FR);

  // STATE
  const [companyInfos, setCompanyInfos] = useState<CompanySearchResult | null>(
    null
  );

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, CREATE_COMPANY_HOOK_OPTIONS(navigate));

  const memoizedStrings = useMemo(() => {
    return localizedStrings[currentLanguage];
  }, [currentLanguage]);

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: Values) {
    const { isAllowed, ...companyValues } = values;

    return createCompany({
      variables: {
        companyInput: {
          ...companyValues
        }
      }
    });
  }

  const handleTranslate = () => {
    const newLanguage =
      currentLanguage === Language.FR ? Language.EN : Language.FR;
    setCurrentLanguage(newLanguage);
  };

  return (
    <div className={`fr-container-fluid ${styles.container}`}>
      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col-12">
          <Button
            priority="tertiary"
            size="medium"
            title={memoizedStrings.translateButton}
            onClick={handleTranslate}
          >
            {memoizedStrings.translateButton}
          </Button>
        </div>
      </div>
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <AccountCompanyAddSiret
            defaultQuery={defaultVatNumber}
            onlyForeignVAT
            {...{
              onCompanyInfos: companyInfos => setCompanyInfos(companyInfos)
            }}
            label={memoizedStrings.vatNumber.label}
            hintText=""
          />
        </div>
      </div>
      {companyInfos && !companyInfos.isRegistered && (
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <Formik<Values>
              initialValues={{
                vatNumber: companyInfos?.vatNumber ?? "",
                companyName: companyInfos?.name ?? "",
                companyTypes: [_CompanyType.Transporter],
                address: companyInfos?.address ?? "",
                contact: "",
                contactPhone: "",
                contactEmail: "",
                isAllowed: false
              }}
              validate={values => {
                return {
                  ...(!values.isAllowed && {
                    isAllowed: memoizedStrings.isAllowed.error
                  }),
                  ...(!(
                    isSiret(values.vatNumber) || isVat(values.vatNumber)
                  ) && {
                    siret: memoizedStrings.vatNumber.error
                  })
                };
              }}
              onSubmit={onSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className={styles.companyAddForm}>
                  <Field name="vatNumber">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.vatNumber.label}
                          hintText={memoizedStrings.vatNumber.hint}
                          state={errors.vatNumber ? "error" : "default"}
                          stateRelatedMessage={errors.vatNumber || ""}
                          disabled={!!companyInfos?.vatNumber}
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <Field name="companyName">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.companyName}
                          disabled={!!companyInfos?.name}
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <Field name="address">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.address}
                          disabled={!!companyInfos?.address}
                          textArea
                          nativeTextAreaProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <Field name="contact">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.contact}
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <Field name="contactEmail">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.contactEmail}
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <Field name="contactPhone">
                    {({ field }) => {
                      return (
                        <Input
                          label={memoizedStrings.contactPhone.label}
                          hintText={memoizedStrings.contactPhone.hint}
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <div className={styles.alertWrapper}>
                    <Alert
                      severity="info"
                      title="Information"
                      description={memoizedStrings.isAllowed.disclaimer}
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
                              label: memoizedStrings.isAllowed.label,
                              nativeInputProps: {
                                name: field.name,
                                checked: field.value,
                                onChange: field.onChange,
                                onBlur: field.onBlur
                              }
                            }
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
                        navigate(-1);
                      }}
                    >
                      {memoizedStrings.cancel}
                    </Button>

                    <Button
                      nativeButtonProps={{ type: "submit" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? memoizedStrings.submit.submitting
                        : memoizedStrings.submit.label}
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
