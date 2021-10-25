import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { generatePath, useHistory } from "react-router-dom";
import routes from "common/routes";
import { GET_ME } from "../dashboard/Dashboard";
import { NotificationError } from "../common/components/Error";
import RedErrorMessage from "../common/components/RedErrorMessage";
import CompanyType from "../login/CompanyType";
import AccountCompanyAddTransporterReceipt from "./accountCompanyAdd/AccountCompanyAddTransporterReceipt";
import AccountCompanyAddTraderReceipt from "./accountCompanyAdd/AccountCompanyAddTraderReceipt";
import AccountCompanyAddBrokerReceipt from "./accountCompanyAdd/AccountCompanyAddBrokerReceipt";
import AccountCompanyAddSiret from "./accountCompanyAdd/AccountCompanyAddSiret";
import AccountCompanyAddEcoOrganisme from "./accountCompanyAdd/AccountCompanyAddEcoOrganisme";
import AccountCompanyAddMembershipRequest from "./accountCompanyAdd/AccountCompanyAddMembershipRequest";
import styles from "./AccountCompanyAdd.module.scss";
import {
  Mutation,
  MutationCreateCompanyArgs,
  Query,
  CompanyType as _CompanyType,
  CompanyPublic,
} from "generated/graphql/types";
import Tooltip from "common/components/Tooltip";
import AccountCompanyAddVhuAgrement from "./accountCompanyAdd/AccountCompanyAddVhuAgrement";
import { InlineRadioButton } from "form/common/components/custom-inputs/RadioButton";
import classNames from "classnames";
const CREATE_COMPANY = gql`
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      id
      name
      givenName
      siret
      companyTypes
    }
  }
`;

const CREATE_TRANSPORTER_RECEIPT = gql`
  mutation CreateTransporterReceipt($input: CreateTransporterReceiptInput!) {
    createTransporterReceipt(input: $input) {
      id
    }
  }
`;

const CREATE_TRADER_RECEIPT = gql`
  mutation CreateTraderReceipt($input: CreateTraderReceiptInput!) {
    createTraderReceipt(input: $input) {
      id
    }
  }
`;

const CREATE_BROKER_RECEIPT = gql`
  mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!) {
    createBrokerReceipt(input: $input) {
      id
    }
  }
`;

const CREATE_VHU_AGREMENT = gql`
  mutation CreateVhuAgrement($input: CreateVhuAgrementInput!) {
    createVhuAgrement(input: $input) {
      id
    }
  }
`;

interface Values extends FormikValues {
  siret: string;
  companyName: string;
  givenName: string;
  address: string;
  companyTypes: _CompanyType[];
  gerepId: string;
  codeNaf: string;
  isAllowed: boolean;
  transporterReceiptNumber: string;
  transporterReceiptValidity: string;
  transporterReceiptDepartment: string;
  ecoOrganismeAgreements: string[];
  traderReceiptNumber: string;
  traderReceiptValidity: string;
  traderReceiptDepartment: string;
  brokerReceiptNumber: string;
  brokerReceiptValidity: string;
  brokerReceiptDepartment: string;
}

/**
 * This component allows to create a company and make
 * the logged in user admin of it
 */
export default function AccountCompanyAdd() {
  const history = useHistory();

  // STATE
  const [companyInfos, setCompanyInfos] = useState<CompanyPublic | null>(null);

  // const [willManageDasris, setWillManageDasris] = useState(false);

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, {
    update(cache, { data }) {
      if (data) {
        const createCompany = data.createCompany;
        const getMeQuery = cache.readQuery<Pick<Query, "me">>({
          query: GET_ME,
        });
        if (getMeQuery == null) {
          return;
        }
        const { me } = getMeQuery;

        cache.writeQuery({
          query: GET_ME,
          data: {
            me: {
              ...me,
              companies: [...me.companies, createCompany],
            },
          },
        });
      }
    },
  });

  const [
    createTransporterReceipt,
    { error: createTransporterReceiptError },
  ] = useMutation(CREATE_TRANSPORTER_RECEIPT);

  const [
    createTraderReceipt,
    { error: createTraderReceiptError },
  ] = useMutation(CREATE_TRADER_RECEIPT);

  const [
    createBrokerReceipt,
    { error: createBrokerReceiptError },
  ] = useMutation(CREATE_BROKER_RECEIPT);

  const [createVhuAgrement, { error: createVhuAgrementError }] = useMutation(
    CREATE_VHU_AGREMENT
  );

  function isTransporter(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Transporter);
  }

  function isTrader(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Trader);
  }

  function isBroker(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Broker);
  }

  function isEcoOrganisme(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.EcoOrganisme);
  }

  function isVhu(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.WasteVehicles);
  }

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: Values) {
    const {
      isAllowed,
      willManageDasris,
      transporterReceiptNumber,
      transporterReceiptValidity,
      transporterReceiptDepartment,
      traderReceiptNumber,
      traderReceiptValidity,
      traderReceiptDepartment,
      brokerReceiptNumber,
      brokerReceiptValidity,
      brokerReceiptDepartment,
      ecoOrganismeAgreements,
      vhuAgrementDemolisseurNumber,
      vhuAgrementDemolisseurDepartment,
      vhuAgrementBroyeurNumber,
      vhuAgrementBroyeurDepartment,
      allowBsdasriTakeOverWithoutSignature,
      ...companyInput
    } = values;

    let transporterReceiptId: string | null = null;

    // create transporter receipt if any
    if (
      !!transporterReceiptNumber &&
      !!transporterReceiptValidity &&
      !!transporterReceiptDepartment &&
      isTransporter(values.companyTypes)
    ) {
      // all fields should be set
      const input = {
        receiptNumber: transporterReceiptNumber,
        validityLimit: transporterReceiptValidity,
        department: transporterReceiptDepartment,
      };

      const { data } = await createTransporterReceipt({
        variables: { input },
      });

      if (data) {
        transporterReceiptId = data.createTransporterReceipt.id;
      }
    }

    let traderReceiptId: string | null = null;

    // create trader receipt if any
    if (
      !!traderReceiptNumber &&
      !!traderReceiptValidity &&
      !!traderReceiptDepartment &&
      isTrader(values.companyTypes)
    ) {
      // all fields should be set
      const input = {
        receiptNumber: traderReceiptNumber,
        validityLimit: traderReceiptValidity,
        department: traderReceiptDepartment,
      };

      const { data } = await createTraderReceipt({
        variables: { input },
      });

      if (data) {
        traderReceiptId = data.createTraderReceipt.id;
      }
    }

    let brokerReceiptId: string | null = null;

    // create broker receipt if any
    if (
      !!brokerReceiptNumber &&
      !!brokerReceiptValidity &&
      !!brokerReceiptDepartment &&
      isBroker(values.companyTypes)
    ) {
      // all fields should be set
      const input = {
        receiptNumber: brokerReceiptNumber,
        validityLimit: brokerReceiptValidity,
        department: brokerReceiptDepartment,
      };

      const { data } = await createBrokerReceipt({
        variables: { input },
      });

      if (data) {
        brokerReceiptId = data.createBrokerReceipt.id;
      }
    }

    let vhuAgrementDemolisseurId: string | null = null;
    let vhuAgrementBroyeurId: string | null = null;

    // create vhu agrement if any
    if (isVhu(values.companyTypes)) {
      if (vhuAgrementDemolisseurNumber && vhuAgrementDemolisseurDepartment) {
        const input = {
          agrementNumber: vhuAgrementDemolisseurNumber,
          department: vhuAgrementDemolisseurDepartment,
        };

        const { data } = await createVhuAgrement({
          variables: { input },
        });

        if (data) {
          vhuAgrementDemolisseurId = data.createVhuAgrement.id;
        }
      }

      if (vhuAgrementBroyeurNumber && vhuAgrementBroyeurDepartment) {
        const input = {
          agrementNumber: vhuAgrementBroyeurNumber,
          department: vhuAgrementBroyeurDepartment,
        };

        const { data } = await createVhuAgrement({
          variables: { input },
        });

        if (data) {
          vhuAgrementBroyeurId = data.createVhuAgrement.id;
        }
      }
    }

    await createCompany({
      variables: {
        companyInput: {
          ...companyInput,
          transporterReceiptId,
          traderReceiptId,
          brokerReceiptId,
          vhuAgrementDemolisseurId,
          vhuAgrementBroyeurId,
          // Filter out empty agreements
          ecoOrganismeAgreements: ecoOrganismeAgreements.filter(Boolean),
          ...(allowBsdasriTakeOverWithoutSignature !== null
            ? { allowBsdasriTakeOverWithoutSignature }
            : {}),
        },
      },
    });

    history.push(
      generatePath(routes.dashboard.bsds.drafts, {
        siret: companyInput.siret,
      })
    );
  }

  function getCompanyTypes(companyInfos: CompanyPublic) {
    if (companyInfos?.installation?.rubriques) {
      const categories = companyInfos.installation.rubriques
        .filter(r => !!r.category)
        .map(r => r.category as _CompanyType);
      const companyTypes = categories.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      return companyTypes;
    }
    return [];
  }

  return (
    <div className="panel">
      <h5 className={styles.subtitle}>Identification</h5>
      <AccountCompanyAddSiret
        {...{
          onCompanyInfos: companyInfos => setCompanyInfos(companyInfos),
        }}
      />
      {companyInfos && companyInfos.isRegistered && (
        <AccountCompanyAddMembershipRequest siret={companyInfos.siret} />
      )}
      {companyInfos && !companyInfos.isRegistered && (
        <Formik<Values>
          initialValues={{
            siret: companyInfos?.siret ?? "",
            companyName: companyInfos?.name ?? "",
            givenName: "",
            address: companyInfos?.address ?? "",
            companyTypes: getCompanyTypes(companyInfos),
            gerepId: companyInfos?.installation?.codeS3ic ?? "",
            codeNaf: companyInfos?.naf ?? "",
            isAllowed: false,
            willManageDasris: false,
            allowBsdasriTakeOverWithoutSignature: null,
            transporterReceiptNumber: "",
            transporterReceiptValidity: "",
            transporterReceiptDepartment: "",
            traderReceiptNumber: "",
            traderReceiptValidity: "",
            traderReceiptDepartment: "",
            brokerReceiptNumber: "",
            brokerReceiptValidity: "",
            brokerReceiptDepartment: "",
            vhuAgrementBroyeurNumber: "",
            vhuAgrementBroyeurDepartment: "",
            vhuAgrementDemolisseurNumber: "",
            vhuAgrementDemolisseurDepartment: "",
            ecoOrganismeAgreements: [],
          }}
          validate={values => {
            // whether or not one of the transporter receipt field is set
            const anyTransporterReceipField =
              !!values.transporterReceiptNumber ||
              !!values.transporterReceiptValidity ||
              !!values.transporterReceiptDepartment;

            const isTransporter_ = isTransporter(values.companyTypes);

            // whether or not one of the trader receipt field is set
            const anyTraderReceipField =
              !!values.traderReceiptNumber ||
              !!values.traderReceiptValidity ||
              !!values.traderReceiptDepartment;

            const isTrader_ = isTrader(values.companyTypes);

            // whether or not one of the broker receipt field is set
            const anyBrokerReceipField =
              !!values.brokerReceiptNumber ||
              !!values.brokerReceiptValidity ||
              !!values.brokerReceiptDepartment;

            const isBroker_ = isBroker(values.companyTypes);

            return {
              ...(values.willManageDasris &&
                values.allowBsdasriTakeOverWithoutSignature === null && {
                  allowBsdasriTakeOverWithoutSignature:
                    "Si établissement est susceptible de produire des DASRI, ce choix est obligatoire",
                }),
              ...(values.companyTypes.length === 0 && {
                companyTypes: "Vous devez préciser le type d'établissement",
              }),
              ...(!values.isAllowed && {
                isAllowed:
                  "Vous devez certifier être autorisé à créer ce compte pour votre entreprise",
              }),
              ...(values.siret.replace(/\s/g, "").length !== 14 && {
                siret: "Le SIRET doit faire 14 caractères",
              }),
              ...(anyTransporterReceipField &&
                isTransporter_ &&
                !values.transporterReceiptNumber && {
                  transporterReceiptNumber: "Champ obligatoire",
                }),
              ...(anyTransporterReceipField &&
                isTransporter_ &&
                !values.transporterReceiptValidity && {
                  transporterReceiptValidity: "Champ obligatoire",
                }),
              ...(anyTraderReceipField &&
                isTrader_ &&
                !values.traderReceiptDepartment && {
                  traderReceiptDepartment: "Champ obligatoire",
                }),
              ...(anyTraderReceipField &&
                isTrader_ &&
                !values.traderReceiptNumber && {
                  traderReceiptNumber: "Champ obligatoire",
                }),
              ...(anyTraderReceipField &&
                isTrader_ &&
                !values.traderReceiptValidity && {
                  traderReceiptValidity: "Champ obligatoire",
                }),
              ...(anyTraderReceipField &&
                isTrader_ &&
                !values.traderReceiptDepartment && {
                  traderReceiptDepartment: "Champ obligatoire",
                }),
              ...(anyBrokerReceipField &&
                isBroker_ &&
                !values.brokerReceiptDepartment && {
                  brokerReceiptDepartment: "Champ obligatoire",
                }),
              ...(anyBrokerReceipField &&
                isBroker_ &&
                !values.brokerReceiptNumber && {
                  brokerReceiptNumber: "Champ obligatoire",
                }),
              ...(anyBrokerReceipField &&
                isBroker_ &&
                !values.brokerReceiptValidity && {
                  brokerReceiptValidity: "Champ obligatoire",
                }),
              ...(anyBrokerReceipField &&
                isBroker_ &&
                !values.brokerReceiptDepartment && {
                  brokerReceiptDepartment: "Champ obligatoire",
                }),
              ...(isEcoOrganisme(values.companyTypes) &&
                values.ecoOrganismeAgreements.length < 1 && {
                  ecoOrganismeAgreements: "Champ obligatoire",
                }),
            };
          }}
          onSubmit={onSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className={styles.companyAddForm}>
              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>
                  Raison sociale
                </label>

                <div className={styles.field__value}>
                  {companyInfos?.name || (
                    <Field
                      type="text"
                      name="companyName"
                      className={`td-input ${styles.textField}`}
                    />
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>
                  Nom usuel{" "}
                  <Tooltip msg="Nom usuel de l'établissement qui permet de différencier plusieurs établissements ayant la même raison sociale" />
                  (optionnel)
                </label>
                <div className={styles.field__value}>
                  <Field
                    type="text"
                    name="givenName"
                    className={`td-input ${styles.textField}`}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>Code NAF</label>
                <div className={styles.field__value}>
                  {companyInfos?.naf ? (
                    `${companyInfos?.naf} - ${companyInfos?.libelleNaf}`
                  ) : (
                    <Field
                      type="text"
                      name="codeNaf"
                      className={`td-input ${styles.textField}`}
                    />
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>Adresse</label>
                <div className={styles.field__value}>
                  {companyInfos?.address || (
                    <Field
                      type="text"
                      name="address"
                      className={`td-input ${styles.textField}`}
                      disabled={!!companyInfos?.address}
                    />
                  )}
                </div>
              </div>

              <h5 className={styles.subtitle}>Activité</h5>

              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>Profil</label>
                <div className={styles.field__value}>
                  <Field name="companyTypes" component={CompanyType} />

                  <RedErrorMessage name="companyTypes" />
                </div>
              </div>

              {isTransporter(values.companyTypes) && (
                <AccountCompanyAddTransporterReceipt />
              )}

              {isTrader(values.companyTypes) && (
                <AccountCompanyAddTraderReceipt />
              )}

              {isBroker(values.companyTypes) && (
                <AccountCompanyAddBrokerReceipt />
              )}

              {isEcoOrganisme(values.companyTypes) && (
                <AccountCompanyAddEcoOrganisme />
              )}

              {isVhu(values.companyTypes) && <AccountCompanyAddVhuAgrement />}

              <div className={styles.field}>
                <label className={`text-right ${styles.bold}`}>
                  Identifiant GEREP (optionnel)
                </label>
                <div className={styles.field__value}>
                  <Field
                    type="text"
                    name="gerepId"
                    className={`td-input ${styles.textField}`}
                  />
                  <div className={styles.smaller}>
                    Gestion Electronique du Registre des Emissions Polluantes.{" "}
                    <a
                      href="https://faq.trackdechets.fr/la-gestion-des-dechets-dangereux#quest-ce-quun-identifiant-gerep"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Plus d'informations sur la FAQ
                    </a>
                  </div>
                </div>
              </div>

              <div className={classNames(styles.field)}>
                <div>
                  <label className="tw-flex tw-items-center">
                    <Field
                      type="checkbox"
                      name="willManageDasris"
                      className="td-checkbox"
                      onChange={() => {
                        setFieldValue(
                          "allowBsdasriTakeOverWithoutSignature",
                          null
                        );
                        setFieldValue(
                          "willManageDasris",
                          !values.willManageDasris
                        );
                      }}
                    />
                    Cet établissement est susceptible de produire des DASRI
                    (déchets d'activité de soins à risques infectieux)
                  </label>
                  {values.willManageDasris && (
                    <>
                      <div className="form__row">
                        <fieldset className="tw-flex tw-items-center">
                          <legend className="tw-font-semibold tw-mb-3">
                            J'autorise l'emport direct de Dasri
                          </legend>
                          <Field
                            name="allowBsdasriTakeOverWithoutSignature"
                            checked={
                              values.allowBsdasriTakeOverWithoutSignature ===
                              true
                            }
                            id="Oui"
                            label="Oui"
                            component={InlineRadioButton}
                            onChange={() =>
                              setFieldValue(
                                "allowBsdasriTakeOverWithoutSignature",
                                true
                              )
                            }
                          />
                          <Field
                            name="allowBsdasriTakeOverWithoutSignature"
                            checked={
                              values.allowBsdasriTakeOverWithoutSignature ===
                              false
                            }
                            id="Non"
                            label="Non"
                            component={InlineRadioButton}
                            onChange={() =>
                              setFieldValue(
                                "allowBsdasriTakeOverWithoutSignature",
                                false
                              )
                            }
                          />
                        </fieldset>
                        <RedErrorMessage name="allowBsdasriTakeOverWithoutSignature" />
                        <div className="notification tw-mt-2">
                          <p className="tw-italic">
                            En cochant "oui", j'atteste avoir signé une
                            convention avec un collecteur pour mes DASRI et
                            j'accepte que ce collecteur les prenne en charge
                            sans ma signature (lors de la collecte) si je ne
                            suis pas disponible. Dans ce cas, je suis informé
                            que je pourrai suivre les bordereaux sur
                            Trackdéchets et disposer de leur archivage sur la
                            plateforme.
                          </p>
                          <p className="tw-italic">
                            Je pourrai modifier ce choix ultérieurement.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <hr />
              <div className={styles.field}>
                <div>
                  <label className="tw-flex tw-items-center">
                    <Field
                      type="checkbox"
                      name="isAllowed"
                      className="td-checkbox"
                    />
                    Je certifie disposer du pouvoir pour créer un compte au nom
                    de mon entreprise
                  </label>

                  <RedErrorMessage name="isAllowed" />
                </div>
              </div>

              <div className={styles["submit-form"]}>
                <button
                  className="btn btn--outline-primary"
                  disabled={isSubmitting}
                  onClick={() => {
                    history.goBack();
                  }}
                >
                  Annuler
                </button>

                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Création..." : "Créer"}
                </button>
              </div>
              {/* // ERRORS */}
              {createTransporterReceiptError && (
                <NotificationError
                  apolloError={createTransporterReceiptError}
                />
              )}
              {createTraderReceiptError && (
                <NotificationError apolloError={createTraderReceiptError} />
              )}
              {createBrokerReceiptError && (
                <NotificationError apolloError={createBrokerReceiptError} />
              )}
              {createVhuAgrementError && (
                <NotificationError apolloError={createVhuAgrementError} />
              )}
              {savingError && <NotificationError apolloError={savingError} />}
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}
