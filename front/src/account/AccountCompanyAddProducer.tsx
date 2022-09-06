import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { useHistory } from "react-router-dom";
import routes from "common/routes";
import { GET_ME } from "../dashboard/Dashboard";
import { NotificationError } from "../common/components/Error";
import AccountCompanyAddSiret from "./accountCompanyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";
import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult,
  PrivateCompanyInput,
} from "generated/graphql/types";
import { MY_COMPANIES } from "./AccountCompanyList";
import { isSiret, isVat } from "generated/constants/companySearchHelpers";

import {
  Container,
  Row,
  Col,
  Toggle,
  Button,
  TextInput,
  Checkbox,
  Alert,
} from "@dataesr/react-dsfr";

const CREATE_COMPANY = gql`
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      id
      name
      givenName
      siret
      vatNumber
      companyTypes
    }
  }
`;

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
export default function AccountCompanyAdd() {
  const history = useHistory();

  // STATE
  const [companyInfos, setCompanyInfos] =
    useState<CompanySearchResult | null>(null);

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, {
    refetchQueries: [
      { query: GET_ME },
      { query: MY_COMPANIES, variables: { first: 10 } },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      history.push(routes.account.companies.list);
    },
  });

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: Values) {
    const { isAllowed, willManageDasris, ...companyValues } = values;

    const { siret, vatNumber, ...formInput } = companyValues;
    const companyInput: PrivateCompanyInput = {
      orgId: !!siret ? siret : vatNumber,
      ...formInput,
    };

    return createCompany({
      variables: {
        companyInput: {
          ...companyInput,
          allowBsdasriTakeOverWithoutSignature: willManageDasris,
        },
      },
    });
  }

  return (
    <Container fluid spacing="ml-6w" className={styles.container}>
      <Row>
        <Col n="12">
          <AccountCompanyAddSiret
            showIndividualInfo
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
                console.log(values);

                return {
                  ...(!values.isAllowed && {
                    isAllowed:
                      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise",
                  }),
                  ...(!isSiret(values.siret) &&
                    !isVat(values.vatNumber) && {
                      siret:
                        "Le SIRET ou le numéro de TVA intracommunautaire doit être valides.",
                    }),
                };
              }}
              onSubmit={onSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className={styles.companyAddForm}>
                  <Field name="givenName">
                    {({ field }) => {
                      return (
                        <TextInput
                          label="Nom usuel"
                          hint="Optionnel"
                          {...field}
                        ></TextInput>
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
                          <TextInput
                            label="Raison sociale"
                            {...field}
                          ></TextInput>
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
                          <TextInput label="Code NAF" {...field}></TextInput>
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
                          <TextInput
                            label="Adresse"
                            disabled={!!companyInfos?.address}
                            {...field}
                          ></TextInput>
                        );
                      }}
                    </Field>
                  )}

                  <Field name="willManageDasris">
                    {({ field }) => {
                      return (
                        <Toggle
                          onChange={field.onChange}
                          id="willManageDasris"
                          checked={field.value}
                          label="Mon établissement produit des DASRI. Je dispose d'une convention avec un collecteur et j'accepte que ce collecteur prenne en charge mes DASRI sans ma signature lors de la collecte si je ne suis pas disponible. Ce choix est modifiable utérieurement."
                          description="(DASRI, Déchets d'Acivité de Soins à Risques Infectieux, par exemple les boîtes et les containers jaunes pour les seringues.)"
                        />
                      );
                    }}
                  </Field>

                  <div className={styles.separator} />

                  <div className={styles.alertWrapper}>
                    <Alert
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
                          label="Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise."
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
                      Annuler
                    </Button>

                    <Button submit disabled={isSubmitting}>
                      {isSubmitting ? "Création..." : "Créer"}
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
