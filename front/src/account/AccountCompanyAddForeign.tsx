import React, { useState, useMemo } from "react";
import { useMutation } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { useHistory, useLocation } from "react-router-dom";
import { Location } from "history";
import { NotificationError } from "../common/components/Error";
import AccountCompanyAddSiret from "./accountCompanyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";
import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult,
} from "generated/graphql/types";
import {
  CREATE_COMPANY,
  CREATE_COMPANY_HOOK_OPTIONS,
} from "./AccountCompanyAdd";
import { isSiret, isVat } from "generated/constants/companySearchHelpers";

import {
  Container,
  Row,
  Col,
  Button,
  TextInput,
  Checkbox,
} from "@dataesr/react-dsfr";

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
  EN = "en",
}

const localizedStrings = {
  en: {
    translateButton: "Traduire en français 🇫🇷",
    vatNumber: {
      label: "Intra-community VAT number or identification number",
      hint: "Example: BE1234567890",
      error:
        "Intra-community VAT number or identification number must be valid",
    },
    companyName: "Company name",
    address: "Address",
    contact: "Contact name",
    contactEmail: "Contact email",
    contactPhone: {
      label: "Contact phone",
      hint: "Example: +3212234567",
    },
    isAllowed: {
      label:
        "I hereby certify that I have the authority to create an account in the name of my company.",
      error:
        "You must certify that you have the authority to create the account in the name of your company",
    },
    submit: {
      submitting: "Creating...",
      label: "Create",
    },
    cancel: "Cancel",
  },
  fr: {
    translateButton: "Translate in english 🇬🇧",
    vatNumber: {
      label: "N° de TVA intracommunautaire ou N° d'identification",
      hint: "Exemple : BE1234567890",
      error:
        "Le SIRET ou le numéro de TVA intracommunautaire doit être valide.",
    },
    companyName: "Nom de l'entreprise",
    address: "Adresse",
    contact: "Nom du responsable",
    contactEmail: "Mail de la personne responsable",
    contactPhone: {
      label: "Téléphone",
      hint: "Exemple : +3212234567",
    },
    isAllowed: {
      label:
        "Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise.",
      error:
        "Vous devez certifier être autorisé à créer ce compte pour votre entreprise",
    },
    submit: {
      submitting: "Création...",
      label: "Créer",
    },
    cancel: "Annuler",
  },
};

/**
 * This component allows to create a producer-lony company and make
 * the logged in user admin of it
 */
export default function AccountCompanyAddForeign() {
  const history = useHistory();
  const location = useLocation<{ vatNumber?: Location }>();
  const defaultVatNumber = location.state?.vatNumber;

  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.FR);

  // STATE
  const [companyInfos, setCompanyInfos] =
    useState<CompanySearchResult | null>(null);

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, CREATE_COMPANY_HOOK_OPTIONS(history));

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
          ...companyValues,
        },
      },
    });
  }

  const handleTranslate = () => {
    const newLanguage =
      currentLanguage === Language.FR ? Language.EN : Language.FR;
    setCurrentLanguage(newLanguage);
  };

  return (
    <Container fluid className={styles.container}>
      <Row spacing="mb-2w">
        <Col n="12">
          <Button
            tertiary
            size="md"
            title={memoizedStrings.translateButton}
            onClick={handleTranslate}
          >
            {memoizedStrings.translateButton}
          </Button>
        </Col>
      </Row>
      <Row>
        <Col n="12">
          <AccountCompanyAddSiret
            defaultQuery={defaultVatNumber}
            onlyForeignVAT
            {...{
              onCompanyInfos: companyInfos => setCompanyInfos(companyInfos),
            }}
          />
        </Col>
      </Row>
      {companyInfos && !companyInfos.isRegistered && (
        <Row>
          <Col n="12">
            <Formik<Values>
              initialValues={{
                vatNumber: companyInfos?.vatNumber ?? "",
                companyName: companyInfos?.name ?? "",
                companyTypes: [_CompanyType.Transporter],
                address: companyInfos?.address ?? "",
                contact: "",
                contactPhone: "",
                contactEmail: "",
                isAllowed: false,
              }}
              validate={values => {
                return {
                  ...(!values.isAllowed && {
                    isAllowed: memoizedStrings.isAllowed.error,
                  }),
                  ...(!(
                    isSiret(values.vatNumber) || isVat(values.vatNumber)
                  ) && {
                    siret: memoizedStrings.vatNumber.error,
                  }),
                };
              }}
              onSubmit={onSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className={styles.companyAddForm}>
                  <Field name="vatNumber">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.vatNumber.label}
                          hint={memoizedStrings.vatNumber.hint}
                          messageType={errors.vatNumber ? "error" : ""}
                          message={errors.vatNumber || ""}
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="companyName">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.companyName}
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="address">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.address}
                          textarea
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="contact">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.contact}
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="contactEmail">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.contactEmail}
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="contactPhone">
                    {({ field }) => {
                      return (
                        <TextInput
                          label={memoizedStrings.contactPhone.label}
                          {...field}
                          hint={memoizedStrings.contactPhone.hint}
                        ></TextInput>
                      );
                    }}
                  </Field>

                  <Field name="isAllowed">
                    {({ field }) => {
                      return (
                        <Checkbox
                          label={memoizedStrings.isAllowed.label}
                          messageType={
                            errors.isAllowed && touched.isAllowed ? "error" : ""
                          }
                          message={
                            errors.isAllowed && touched.isAllowed
                              ? errors.isAllowed
                              : ""
                          }
                          id="isAllowed"
                          // @ts-ignore
                          checked={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      );
                    }}
                  </Field>

                  <div className={styles["submit-form"]}>
                    <Button
                      tertiary
                      disabled={isSubmitting}
                      onClick={() => {
                        history.goBack();
                      }}
                    >
                      {memoizedStrings.cancel}
                    </Button>

                    <Button submit disabled={isSubmitting}>
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
          </Col>
        </Row>
      )}
    </Container>
  );
}
