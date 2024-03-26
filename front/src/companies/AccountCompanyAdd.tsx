import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form, Formik, FormikValues } from "formik";
import { useNavigate } from "react-router-dom";
import routes from "../Apps/routes";
import { NotificationError } from "../Apps/common/Components/Error/Error";
import RedErrorMessage from "../common/components/RedErrorMessage";
import CompanyType from "../login/CompanyType";
import AccountCompanyAddTransporterReceipt from "./companyAdd/AccountCompanyAddTransporterReceipt";
import AccountCompanyAddTraderReceipt from "./companyAdd/AccountCompanyAddTraderReceipt";
import AccountCompanyAddBrokerReceipt from "./companyAdd/AccountCompanyAddBrokerReceipt";
import AccountCompanyAddSiret from "./companyAdd/AccountCompanyAddSiret";
import AccountCompanyAddEcoOrganisme from "./companyAdd/AccountCompanyAddEcoOrganisme";
import AccountCompanyAddWorker from "./companyAdd/AccountCompanyAddWorker";
import AccountCompanyAddVhuAgrement from "./companyAdd/AccountCompanyAddVhuAgrement";

import styles from "./AccountCompanyAdd.module.scss";

import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult
} from "@td/codegen-ui";
import classNames from "classnames";
import { MY_COMPANIES } from "./CompaniesList";
import { isFRVat, isSiret, isVat, isForeignVat } from "@td/constants";
import {
  CREATE_WORKER_CERTIFICATION,
  UPDATE_COMPANY_WORKER_CERTIFICATION
} from "../account/fields/forms/AccountFormCompanyWorkerCertification";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        siret
        orgId
        companyTypes
        userPermissions
      }
    }
  }
`;

export const CREATE_COMPANY = gql`
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

export const CREATE_COMPANY_HOOK_OPTIONS = navigate => ({
  refetchQueries: [
    { query: GET_ME },
    { query: MY_COMPANIES, variables: { first: 10 } }
  ],
  awaitRefetchQueries: true,
  onCompleted: () => {
    navigate(routes.companies.index);
  }
});

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

export interface Values extends FormikValues {
  siret: string;
  vatNumber: string;
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
  const navigate = useNavigate();

  // STATE
  const [companyInfos, setCompanyInfos] = useState<CompanySearchResult | null>(
    null
  );

  // QUERIES AND MUTATIONS
  const [createCompany, { error: savingError }] = useMutation<
    Pick<Mutation, "createCompany">,
    MutationCreateCompanyArgs
  >(CREATE_COMPANY, CREATE_COMPANY_HOOK_OPTIONS(navigate));

  const [createTransporterReceipt, { error: createTransporterReceiptError }] =
    useMutation(CREATE_TRANSPORTER_RECEIPT);

  const [createTraderReceipt, { error: createTraderReceiptError }] =
    useMutation(CREATE_TRADER_RECEIPT);

  const [createBrokerReceipt, { error: createBrokerReceiptError }] =
    useMutation(CREATE_BROKER_RECEIPT);

  const [createVhuAgrement, { error: createVhuAgrementError }] =
    useMutation(CREATE_VHU_AGREMENT);

  const [createWorkerCertification, { error: createWorkerCertificationError }] =
    useMutation(CREATE_WORKER_CERTIFICATION);

  const [
    updateCompanyWorkerCertification,
    { error: updateCompanyWorkerCertificationError }
  ] = useMutation(UPDATE_COMPANY_WORKER_CERTIFICATION);

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

  function isForcedTransporter(companyInfos: CompanySearchResult) {
    return !!companyInfos.vatNumber && !companyInfos.siret;
  }

  function isWorker(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Worker);
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
      ...companyValues
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
        department: transporterReceiptDepartment
      };

      const { data } = await createTransporterReceipt({
        variables: { input }
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
        department: traderReceiptDepartment
      };

      const { data } = await createTraderReceipt({
        variables: { input }
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
        department: brokerReceiptDepartment
      };

      const { data } = await createBrokerReceipt({
        variables: { input }
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
          department: vhuAgrementDemolisseurDepartment
        };

        const { data } = await createVhuAgrement({
          variables: { input }
        });

        if (data) {
          vhuAgrementDemolisseurId = data.createVhuAgrement.id;
        }
      }

      if (vhuAgrementBroyeurNumber && vhuAgrementBroyeurDepartment) {
        const input = {
          agrementNumber: vhuAgrementBroyeurNumber,
          department: vhuAgrementBroyeurDepartment
        };

        const { data } = await createVhuAgrement({
          variables: { input }
        });

        if (data) {
          vhuAgrementBroyeurId = data.createVhuAgrement.id;
        }
      }
    }

    let workerCertificationId: string | null = null;

    if (isWorker(values.companyTypes)) {
      const input = {
        hasSubSectionFour: values.hasSubSectionFour,
        hasSubSectionThree: values.hasSubSectionThree,
        certificationNumber: values.certificationNumber,
        validityLimit: values.validityLimit,
        organisation: values.organisation
      };
      const { data } = await createWorkerCertification({
        variables: { input }
      });

      if (data) {
        workerCertificationId = data.createWorkerCertification.id;
      }
    }

    // remove those values from company creation
    delete companyValues.hasSubSectionFour;
    delete companyValues.hasSubSectionThree;
    delete companyValues.certificationNumber;
    delete companyValues.validityLimit;
    delete companyValues.organisation;

    return createCompany({
      variables: {
        companyInput: {
          ...companyValues,
          transporterReceiptId,
          traderReceiptId,
          brokerReceiptId,
          vhuAgrementDemolisseurId,
          vhuAgrementBroyeurId,
          // Filter out empty agreements
          ecoOrganismeAgreements: ecoOrganismeAgreements.filter(Boolean),
          ...(allowBsdasriTakeOverWithoutSignature !== null
            ? { allowBsdasriTakeOverWithoutSignature }
            : {})
        }
      }
    }).then(res => {
      if (workerCertificationId) {
        updateCompanyWorkerCertification({
          variables: {
            id: res.data?.createCompany.id,
            workerCertificationId
          }
        });
      }
    });
  }

  function initCompanyTypes(companyInfos: CompanySearchResult) {
    if (companyInfos?.installation?.rubriques) {
      const categories = companyInfos.installation.rubriques
        .filter(r => !!r.category)
        .map(r => r.category as _CompanyType);
      const companyTypes = categories.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      return companyTypes;
    } else if (isForcedTransporter(companyInfos)) {
      return [_CompanyType.Transporter];
    }
    return [];
  }

  const isForeignCompany =
    companyInfos?.vatNumber && isForeignVat(companyInfos.vatNumber);

  const handleCompanyTypeChange = (e, arrayHelpers, companyType, value) => {
    if (e.target.checked) {
      arrayHelpers.push(companyType.value);
    } else {
      const idx = value.indexOf(companyType.value);
      arrayHelpers.remove(idx);
    }
  };

  return (
    <div className={`fr-container-fluid ${styles.container}`}>
      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col-12">
          <h5 className={styles.subtitle}>Identification</h5>
          <AccountCompanyAddSiret
            {...{
              onCompanyInfos: companyInfos => setCompanyInfos(companyInfos)
            }}
          />
          {companyInfos && !companyInfos.isRegistered && isForeignCompany && (
            <>
              <div className={styles.alertWrapper}>
                <Alert
                  severity="error"
                  title="Cet établissement n'est pas immatriculé en France"
                  description={
                    <>
                      Votre entreprise n'est pas immatriculée en France, mais
                      vous transportez des déchets dangereux sur le territoire
                      français. Vous devez passer par la création de
                      transporteur étranger.
                      <br />
                      Your company is not registered in France but you are
                      transporting hazardous waste on french territory. You must
                      create a foreign transporter.
                    </>
                  }
                />
              </div>
              <Button
                priority="tertiary"
                onClick={() => {
                  navigate(routes.companies.create.foreign, {
                    state: { vatNumber: companyInfos.vatNumber }
                  });
                }}
              >
                Créer un transporteur étranger / Create a foreign transporter
              </Button>
            </>
          )}
          {companyInfos && !isForeignCompany && !companyInfos.isRegistered && (
            <Formik<Values>
              initialValues={{
                siret: companyInfos?.siret ?? "",
                vatNumber: companyInfos?.vatNumber ?? "",
                companyName: companyInfos?.name ?? "",
                givenName: "",
                address: companyInfos?.address ?? "",
                companyTypes: initCompanyTypes(companyInfos),
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
                hasSubSectionFour: false,
                hasSubSectionThree: false,
                certificationNumber: "",
                validityLimit: null,
                organisation: ""
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
                  ...(!values.companyName && {
                    companyName: "Champ obligatoire"
                  }),
                  ...(!values.address && {
                    address: "Champ obligatoire"
                  }),
                  ...(values.willManageDasris &&
                    values.allowBsdasriTakeOverWithoutSignature === null && {
                      allowBsdasriTakeOverWithoutSignature:
                        "Si l'établissement est susceptible de produire des DASRI, ce choix est obligatoire"
                    }),
                  ...(values.companyTypes.length === 0 && {
                    companyTypes: "Vous devez préciser le type d'établissement"
                  }),
                  ...(!values.isAllowed && {
                    isAllowed:
                      "Vous devez certifier être autorisé à créer ce compte pour votre entreprise"
                  }),
                  ...((isFRVat(values.vatNumber) ||
                    (!isSiret(
                      values.siret,
                      import.meta.env.VITE_ALLOW_TEST_COMPANY
                    ) &&
                      !isVat(values.vatNumber))) && {
                    siret:
                      "Le SIRET ou le numéro de TVA intracommunautaire doit être valides. (seuls les caractères alphanumériques sont acceptés, pas d'espaces ni de signes de ponctuation)"
                  }),
                  ...(anyTransporterReceipField &&
                    isTransporter_ &&
                    !values.transporterReceiptNumber && {
                      transporterReceiptNumber: "Champ obligatoire"
                    }),
                  ...(anyTransporterReceipField &&
                    isTransporter_ &&
                    !values.transporterReceiptValidity && {
                      transporterReceiptValidity: "Champ obligatoire"
                    }),
                  ...(anyTraderReceipField &&
                    isTrader_ &&
                    !values.traderReceiptDepartment && {
                      traderReceiptDepartment: "Champ obligatoire"
                    }),
                  ...(anyTraderReceipField &&
                    isTrader_ &&
                    !values.traderReceiptNumber && {
                      traderReceiptNumber: "Champ obligatoire"
                    }),
                  ...(anyTraderReceipField &&
                    isTrader_ &&
                    !values.traderReceiptValidity && {
                      traderReceiptValidity: "Champ obligatoire"
                    }),
                  ...(anyTraderReceipField &&
                    isTrader_ &&
                    !values.traderReceiptDepartment && {
                      traderReceiptDepartment: "Champ obligatoire"
                    }),
                  ...(anyBrokerReceipField &&
                    isBroker_ &&
                    !values.brokerReceiptDepartment && {
                      brokerReceiptDepartment: "Champ obligatoire"
                    }),
                  ...(anyBrokerReceipField &&
                    isBroker_ &&
                    !values.brokerReceiptNumber && {
                      brokerReceiptNumber: "Champ obligatoire"
                    }),
                  ...(anyBrokerReceipField &&
                    isBroker_ &&
                    !values.brokerReceiptValidity && {
                      brokerReceiptValidity: "Champ obligatoire"
                    }),
                  ...(anyBrokerReceipField &&
                    isBroker_ &&
                    !values.brokerReceiptDepartment && {
                      brokerReceiptDepartment: "Champ obligatoire"
                    }),
                  ...(isEcoOrganisme(values.companyTypes) &&
                    values.ecoOrganismeAgreements.length < 1 && {
                      ecoOrganismeAgreements: "Champ obligatoire"
                    }),
                  ...(values.hasSubSectionThree &&
                    !values.certificationNumber && {
                      certificationNumber: "Champ obligatoire"
                    }),
                  ...(values.hasSubSectionThree &&
                    !values.validityLimit && {
                      validityLimit: "Champ obligatoire"
                    }),
                  ...(values.hasSubSectionThree &&
                    !values.organisation && {
                      organisation: "Champ obligatoire"
                    })
                };
              }}
              onSubmit={onSubmit}
            >
              {({
                values,
                setFieldValue,
                isSubmitting,
                errors,
                touched,
                handleSubmit
              }) => (
                <Form className={styles.companyAddForm} onSubmit={handleSubmit}>
                  <Field name="givenName">
                    {({ field }) => {
                      return (
                        <Input
                          label="Nom usuel (optionnel)"
                          hintText="Nom usuel de l'établissement qui permet de différencier plusieurs établissements ayant la même raison sociale"
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <div className={styles.field}>
                    {companyInfos?.name ? (
                      <>
                        <label className={`text-right`}>Raison sociale</label>

                        <div className={styles.field__value}>
                          {companyInfos.name}
                        </div>
                      </>
                    ) : (
                      <Field name="companyName">
                        {({ field }) => {
                          return (
                            <Input
                              label={"Raison Sociale"}
                              disabled={!!companyInfos?.name}
                              nativeInputProps={field}
                            ></Input>
                          );
                        }}
                      </Field>
                    )}
                  </div>

                  {companyInfos?.naf ? (
                    <div className={styles.field}>
                      <label className={`text-right`}>Code NAF</label>
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
                            disabled={isForcedTransporter(companyInfos)}
                            nativeInputProps={field}
                          ></Input>
                        );
                      }}
                    </Field>
                  )}

                  {companyInfos?.address ? (
                    <div className={styles.field}>
                      <label className={`text-right`}>Adresse</label>
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
                            state={
                              errors.address && touched.address
                                ? "error"
                                : "default"
                            }
                            stateRelatedMessage={
                              errors.address && touched.address
                                ? errors.isAllowed
                                : ""
                            }
                            nativeInputProps={field}
                          ></Input>
                        );
                      }}
                    </Field>
                  )}

                  <Field name="contact">
                    {({ field }) => {
                      return (
                        <Input
                          label="Personne à contacter"
                          hintText="Optionnel"
                          nativeInputProps={field}
                        ></Input>
                      );
                    }}
                  </Field>

                  <div className="fr-container-fluid fr-mb-4w">
                    <div className="fr-grid-row fr-grid-row--gutters">
                      <div className="fr-col-6">
                        <Field name="contactPhone">
                          {({ field }) => {
                            return (
                              <Input
                                label="Téléphone"
                                hintText="Optionnel"
                                nativeInputProps={field}
                              ></Input>
                            );
                          }}
                        </Field>
                      </div>
                      <div className="fr-col-6">
                        <Field name="contactEmail">
                          {({ field }) => {
                            return (
                              <Input
                                label="E-mail"
                                hintText="Optionnel"
                                nativeInputProps={field}
                              ></Input>
                            );
                          }}
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className={styles.separator} />

                  <div className={styles.field}>
                    <div className={styles.field__value}>
                      {isForcedTransporter(companyInfos) ? (
                        <Field
                          name="companyTypes"
                          value={[_CompanyType.Transporter]}
                          disabled={true}
                        >
                          {({ field, form, meta }) => {
                            return (
                              <CompanyType
                                field={field}
                                form={form}
                                meta={meta}
                                label={""}
                                handleChange={handleCompanyTypeChange}
                              />
                            );
                          }}
                        </Field>
                      ) : (
                        <Field
                          name="companyTypes"
                          component={CompanyType}
                          handleChange={handleCompanyTypeChange}
                          subfields={{
                            [_CompanyType.Transporter]: isTransporter(
                              values.companyTypes
                            ) && <AccountCompanyAddTransporterReceipt />,
                            [_CompanyType.Worker]: isWorker(
                              values.companyTypes
                            ) && <AccountCompanyAddWorker />,
                            [_CompanyType.Trader]: isTrader(
                              values.companyTypes
                            ) && <AccountCompanyAddTraderReceipt />,
                            [_CompanyType.Broker]: isBroker(
                              values.companyTypes
                            ) && <AccountCompanyAddBrokerReceipt />,
                            [_CompanyType.EcoOrganisme]: isEcoOrganisme(
                              values.companyTypes
                            ) && <AccountCompanyAddEcoOrganisme />,
                            [_CompanyType.WasteVehicles]: isVhu(
                              values.companyTypes
                            ) && <AccountCompanyAddVhuAgrement />
                          }}
                        />
                      )}
                      <RedErrorMessage name="companyTypes" />
                    </div>
                  </div>

                  <div className={styles.separator} />

                  {!isForcedTransporter(companyInfos) && (
                    <>
                      <Field name="gerepId">
                        {({ field }) => {
                          return (
                            <Input
                              label="Identifiant GEREP (optionnel)"
                              hintText="Toute installation de traitement classée et reconnue par l’état (ICPE) et toute entreprise produisant plus de 2 tonnes de déchets et/ou 2000 tonnes de déchets non dangereux est tenue de réaliser annuellement une déclaration d’émissions polluantes et de déchets en ligne. Elle peut le faire via l’application ministérielle web GEREP."
                              nativeInputProps={field}
                            ></Input>
                          );
                        }}
                      </Field>

                      <div className={classNames(styles.field)}>
                        <Field name="allowBsdasriTakeOverWithoutSignature">
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
                      </div>
                    </>
                  )}
                  <hr />
                  <div className={styles.field}>
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
                                  "Je certifie disposer du pouvoir pour créer un compte au nom de mon entreprise",
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
                  </div>

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

                  <div className={styles["submit-form"]}>
                    <Button
                      priority="tertiary"
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        navigate(-1);
                      }}
                    >
                      Annuler
                    </Button>

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Création..." : "Créer"}
                    </Button>
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
                  {createWorkerCertificationError && (
                    <NotificationError
                      apolloError={createWorkerCertificationError}
                    />
                  )}
                  {updateCompanyWorkerCertificationError && (
                    <NotificationError
                      apolloError={updateCompanyWorkerCertificationError}
                    />
                  )}
                  {savingError && (
                    <NotificationError apolloError={savingError} />
                  )}
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
}
