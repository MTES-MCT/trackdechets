import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import { generatePath, useNavigate } from "react-router-dom";
import routes from "../../routes";
import { NotificationError } from "../../common/Components/Error/Error";
import RedErrorMessage from "../../../common/components/RedErrorMessage";
import AccountCompanyAddSiret from "./companyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";

import {
  Mutation,
  MutationCreateCompanyArgs,
  CompanyType as _CompanyType,
  CompanySearchResult,
  Maybe,
  WasteVehiclesType
} from "@td/codegen-ui";
import classNames from "classnames";
import {
  CREATE_COMPANY,
  MY_COMPANIES,
  CREATE_TRANSPORTER_RECEIPT,
  CREATE_TRADER_RECEIPT,
  CREATE_BROKER_RECEIPT,
  CREATE_VHU_AGREMENT
} from "../common/queries";
import {
  isFRVat,
  isSiret,
  isVat,
  isForeignVat,
  isValidWebsite
} from "@td/constants";
import { CREATE_WORKER_CERTIFICATION } from "../../Account/fields/forms/AccountFormCompanyWorkerCertification";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

import GivenNameNotice from "../common/Components/GivenNameNotice/GivenNameNotice";
import FormikCompanyTypeForm, {
  FormikCompanyTypeValues
} from "../common/Components/CompanyTypeForm/FormikCompanyTypeForm";

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

export const CREATE_COMPANY_HOOK_OPTIONS = navigate => ({
  refetchQueries: [
    { query: GET_ME },
    { query: MY_COMPANIES, variables: { first: 10 } }
  ],
  awaitRefetchQueries: true,
  onCompleted: data => {
    navigate(
      generatePath(routes.companies.details, {
        siret: data.createCompany.siret || data.createCompany.vatNumber
      })
    );
  }
});

export type CompanyValues = FormikCompanyTypeValues & {
  siret?: string | null;
  vatNumber?: string | null;
  companyName: string;
  givenName?: string | null;
  address: string;
  companyTypes: _CompanyType[];
  gerepId?: string | null;
  codeNaf?: string | null;
  contact?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isAllowed: boolean;
  willManageDasris: boolean;
  allowBsdasriTakeOverWithoutSignature: Maybe<boolean>;
};

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

  function isVhuDemolisseur(
    companyTypes: _CompanyType[],
    wasteVechiclesTypes: WasteVehiclesType[]
  ) {
    return (
      isVhu(companyTypes) &&
      wasteVechiclesTypes.includes(WasteVehiclesType.Demolisseur)
    );
  }

  function isVhuBroyeur(
    companyTypes: _CompanyType[],
    wasteVechiclesTypes: WasteVehiclesType[]
  ) {
    return (
      isVhu(companyTypes) &&
      wasteVechiclesTypes.includes(WasteVehiclesType.Broyeur)
    );
  }

  function isForcedTransporter(companyInfos: CompanySearchResult) {
    return !!companyInfos.vatNumber && !companyInfos.siret;
  }

  function isWorker(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Worker);
  }

  function isWasteProcessor(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Wasteprocessor);
  }

  function isWasteCollector(companyTypes: _CompanyType[]) {
    return companyTypes.includes(_CompanyType.Collector);
  }

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: CompanyValues) {
    const {
      isAllowed,
      willManageDasris,
      transporterReceipt,
      traderReceipt,
      brokerReceipt,
      vhuAgrementBroyeur,
      vhuAgrementDemolisseur,
      workerCertification,
      ecoOrganismeAgreements,
      allowBsdasriTakeOverWithoutSignature,
      wasteProcessorTypes,
      collectorTypes,
      wasteVehiclesTypes,
      ...companyValues
    } = values;

    let transporterReceiptId: string | null = null;
    // create transporter receipt if any
    if (!!transporterReceipt && isTransporter(values.companyTypes)) {
      const { data } = await createTransporterReceipt({
        variables: { input: transporterReceipt }
      });

      if (data) {
        transporterReceiptId = data.createTransporterReceipt.id;
      }
    }

    let traderReceiptId: string | null = null;

    // create trader receipt if any
    if (!!traderReceipt && isTrader(values.companyTypes)) {
      const { data } = await createTraderReceipt({
        variables: { input: traderReceipt }
      });

      if (data) {
        traderReceiptId = data.createTraderReceipt.id;
      }
    }

    let brokerReceiptId: string | null = null;

    // create broker receipt if any
    if (!!brokerReceipt && isBroker(values.companyTypes)) {
      const { data } = await createBrokerReceipt({
        variables: { input: brokerReceipt }
      });

      if (data) {
        brokerReceiptId = data.createBrokerReceipt.id;
      }
    }

    let vhuAgrementDemolisseurId: string | null = null;
    let vhuAgrementBroyeurId: string | null = null;

    // create vhu agrements if any

    if (
      isVhuDemolisseur(values.companyTypes, values.wasteVehiclesTypes) &&
      vhuAgrementDemolisseur
    ) {
      const { data } = await createVhuAgrement({
        variables: { input: vhuAgrementDemolisseur }
      });

      if (data) {
        vhuAgrementDemolisseurId = data.createVhuAgrement.id;
      }
    }

    if (
      isVhuBroyeur(values.companyTypes, values.wasteVehiclesTypes) &&
      vhuAgrementBroyeur
    ) {
      const { data } = await createVhuAgrement({
        variables: { input: vhuAgrementBroyeur }
      });

      if (data) {
        vhuAgrementBroyeurId = data.createVhuAgrement.id;
      }
    }

    let workerCertificationId: string | null = null;

    if (isWorker(values.companyTypes) && workerCertification) {
      const { data } = await createWorkerCertification({
        variables: {
          input: {
            ...workerCertification,
            hasSubSectionThree:
              workerCertification?.hasSubSectionThree ?? false,
            hasSubSectionFour: workerCertification?.hasSubSectionFour ?? false
          }
        }
      });

      if (data) {
        workerCertificationId = data.createWorkerCertification.id;
      }
    }

    return createCompany({
      variables: {
        companyInput: {
          ...companyValues,
          wasteProcessorTypes: isWasteProcessor(values.companyTypes)
            ? wasteProcessorTypes
            : [],
          collectorTypes: isWasteCollector(values.companyTypes)
            ? collectorTypes
            : [],
          wasteVehiclesTypes: isVhu(values.companyTypes)
            ? wasteVehiclesTypes
            : [],
          transporterReceiptId,
          traderReceiptId,
          brokerReceiptId,
          vhuAgrementDemolisseurId,
          vhuAgrementBroyeurId,
          workerCertificationId,
          // Filter out empty agreements
          ecoOrganismeAgreements: isEcoOrganisme(values.companyTypes)
            ? ecoOrganismeAgreements.filter(Boolean)
            : [],
          ...(allowBsdasriTakeOverWithoutSignature !== null
            ? { allowBsdasriTakeOverWithoutSignature }
            : {})
        }
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
            <Formik<CompanyValues>
              initialValues={{
                siret: companyInfos?.siret,
                vatNumber: companyInfos?.vatNumber,
                companyName: companyInfos?.name ?? "",
                givenName: null,
                address: companyInfos?.address ?? "",
                companyTypes: initCompanyTypes(companyInfos),
                collectorTypes: [],
                wasteProcessorTypes: [],
                wasteVehiclesTypes: [],
                gerepId: companyInfos?.installation?.codeS3ic,
                codeNaf: companyInfos?.naf,
                isAllowed: false,
                willManageDasris: false,
                allowBsdasriTakeOverWithoutSignature: null,
                transporterReceipt: null,
                traderReceipt: null,
                brokerReceipt: null,
                vhuAgrementBroyeur: null,
                vhuAgrementDemolisseur: null,
                workerCertification: null,
                ecoOrganismeAgreements: []
              }}
              validate={values => {
                const filledTransporterRecepisseFields = [
                  values.transporterReceipt?.receiptNumber,
                  values.transporterReceipt?.validityLimit,
                  values.transporterReceipt?.department
                ].filter(Boolean);

                // Les champs du récépissé transporteur doivent être
                // soit tous nuls soit tous remplis.
                const missingTransporterReceipField =
                  isTransporter(values.companyTypes) &&
                  filledTransporterRecepisseFields.length > 0 &&
                  filledTransporterRecepisseFields.length < 3;

                const missingTraderReceiptField =
                  isTrader(values.companyTypes) &&
                  (!values.traderReceipt?.department ||
                    !values.traderReceipt?.validityLimit ||
                    !values.traderReceipt?.receiptNumber);

                const missingBrokerReceiptField =
                  isBroker(values.companyTypes) &&
                  (!values.brokerReceipt?.department ||
                    !values.brokerReceipt?.validityLimit ||
                    !values.brokerReceipt?.receiptNumber);

                const missingVhuBroyeurAgrementField =
                  isVhuBroyeur(
                    values.companyTypes,
                    values.wasteVehiclesTypes
                  ) &&
                  (!values.vhuAgrementBroyeur?.agrementNumber ||
                    !values.vhuAgrementBroyeur?.department);

                const missingVhuDemolisseurAgrementField =
                  isVhuDemolisseur(
                    values.companyTypes,
                    values.wasteVehiclesTypes
                  ) &&
                  (!values.vhuAgrementDemolisseur?.agrementNumber ||
                    !values.vhuAgrementDemolisseur?.department);

                const missingCertification =
                  isWorker(values.companyTypes) &&
                  values.workerCertification?.hasSubSectionThree &&
                  (!values.workerCertification?.certificationNumber ||
                    !values.workerCertification?.validityLimit ||
                    !values?.workerCertification?.organisation);

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

                  ...(missingTransporterReceipField
                    ? {
                        transporterReceipt: {
                          receiptNumber: !values.transporterReceipt
                            ?.receiptNumber
                            ? "Champ requis"
                            : undefined,
                          validityLimit: !values.transporterReceipt
                            ?.validityLimit
                            ? "Champ requis"
                            : undefined,
                          department: !values.transporterReceipt?.department
                            ? "Champ requis"
                            : undefined
                        }
                      }
                    : {}),
                  ...(missingTraderReceiptField
                    ? {
                        traderReceipt: {
                          receiptNumber: !values.traderReceipt?.receiptNumber
                            ? "Champ requis"
                            : undefined,
                          validityLimit: !values.traderReceipt?.validityLimit
                            ? "Champ requis"
                            : undefined,
                          department: !values.traderReceipt?.department
                            ? "Champ requis"
                            : undefined
                        }
                      }
                    : {}),
                  ...(missingBrokerReceiptField
                    ? {
                        brokerReceipt: {
                          receiptNumber: !values.brokerReceipt?.receiptNumber
                            ? "Champ requis"
                            : undefined,
                          validityLimit: !values.brokerReceipt?.validityLimit
                            ? "Champ requis"
                            : undefined,
                          department: !values.brokerReceipt?.department
                            ? "Champ requis"
                            : undefined
                        }
                      }
                    : {}),
                  ...(missingVhuBroyeurAgrementField
                    ? {
                        vhuAgrementBroyeur: {
                          agrementNumber: !values.vhuAgrementBroyeur
                            ?.agrementNumber
                            ? "Champ requis"
                            : undefined,
                          department: !values.vhuAgrementBroyeur?.department
                            ? "Champ requis"
                            : undefined
                        }
                      }
                    : {}),
                  ...(missingVhuDemolisseurAgrementField
                    ? {
                        vhuAgrementDemolisseur: {
                          agrementNumber: !values.vhuAgrementDemolisseur
                            ?.agrementNumber
                            ? "Champ requis"
                            : undefined,
                          department: !values.vhuAgrementDemolisseur?.department
                            ? "Champ requis"
                            : undefined
                        }
                      }
                    : {}),
                  ecoOrganismeAgreements: (
                    values.ecoOrganismeAgreements ?? []
                  ).map(a => {
                    if (!a) {
                      return "Champ requis";
                    }
                    if (!isValidWebsite(a)) {
                      return "Invalide URL";
                    }
                    return null;
                  }),
                  ...(missingCertification
                    ? {
                        workerCertification: {
                          certificationNumber: !values.workerCertification
                            ?.certificationNumber
                            ? "Champ obligatoire"
                            : undefined,
                          validityLimit: !values.workerCertification
                            ?.validityLimit
                            ? "Champ obligatoire"
                            : undefined,
                          organisation: !values.workerCertification
                            ?.organisation
                            ? "Champ obligatoire"
                            : undefined
                        }
                      }
                    : {})
                };
              }}
              onSubmit={onSubmit}
            >
              {({
                values,
                setFieldValue,
                isSubmitting,
                handleBlur,
                handleChange,
                errors,
                touched,
                submitCount
              }) => {
                return (
                  <Form className={styles.companyAddForm}>
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
                    <GivenNameNotice />

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
                          ></Field>
                        ) : (
                          <FormikCompanyTypeForm
                            values={values}
                            setFieldValue={setFieldValue}
                            handleBlur={handleBlur}
                            handleChange={handleChange}
                            errors={errors}
                            touched={touched}
                            submitCount={submitCount}
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
                              className="fr-link"
                              href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/inviter-des-personnes-a-rejoindre-mon-etablissement"
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
                      <NotificationError
                        apolloError={createTraderReceiptError}
                      />
                    )}
                    {createBrokerReceiptError && (
                      <NotificationError
                        apolloError={createBrokerReceiptError}
                      />
                    )}
                    {createVhuAgrementError && (
                      <NotificationError apolloError={createVhuAgrementError} />
                    )}
                    {createWorkerCertificationError && (
                      <NotificationError
                        apolloError={createWorkerCertificationError}
                      />
                    )}
                    {savingError && (
                      <NotificationError apolloError={savingError} />
                    )}
                  </Form>
                );
              }}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
}
