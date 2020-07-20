import React, { useState } from "react";
import { useMutation } from "@apollo/react-hooks";
import { Field, Form, Formik, FormikProps, FormikValues } from "formik";
import gql from "graphql-tag";
import { useHistory } from "react-router-dom";
import { GET_ME } from "../dashboard/Dashboard";
import { NotificationError } from "../common/Error";
import RedErrorMessage from "../common/RedErrorMessage";
import CompanyType from "../login/CompanyType";
import AccountCompanyAddTransporterReceipt from "./accountCompanyAdd/AccountCompanyAddTransporterReceipt";
import AccountCompanyAddTraderReceipt from "./accountCompanyAdd/AccountCompanyAddTraderReceipt";
import AccountCompanyAddSiret from "./accountCompanyAdd/AccountCompanyAddSiret";
import styles from "./AccountCompanyAdd.module.scss";
import { FaHourglassHalf } from "react-icons/fa";
import {
  Mutation,
  MutationCreateCompanyArgs,
  Query,
  CompanyType as _CompanyType,
} from "../generated/graphql/types";

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

const CREATE_UPLOAD_LINK = gql`
  mutation CreateUploadLink($fileName: String!, $fileType: String!) {
    createUploadLink(fileName: $fileName, fileType: $fileType) {
      signedUrl
      key
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

interface Values extends FormikValues {
  siret: string;
  companyName: string;
  address: string;
  companyTypes: _CompanyType[];
  gerepId: string;
  codeNaf: string;
  document: File | null;
  isAllowed: boolean;
  transporterReceiptNumber: string;
  transporterReceiptValidity: string;
  transporterReceiptDepartment: string;
  traderReceiptNumber: string;
  traderReceiptValidity: string;
  traderReceiptDepartment: string;
}

/**
 * This component allows to create a company and make
 * the logged in user admin of it
 */
export default function AccountCompanyAdd() {
  const history = useHistory();

  // STATES
  const [toggleForm, setToggleForm] = useState(false);

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

        const companies = me.companies || [];
        companies.push(createCompany);

        me.companies = companies;

        cache.writeQuery({
          query: GET_ME,
          data: { me },
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

  const [createUploadLink, { error: uploadError }] = useMutation<{
    createUploadLink: { signedUrl: string; key: string };
  }>(CREATE_UPLOAD_LINK);

  /**
   * Callback passed to AccountCompanyAddSiret to update the form
   * based on the result of { query { companyInfos } }
   * @param companyInfos
   * @param param1
   */
  function onCompanyInfos(
    companyInfos,
    {
      values,
      setFieldValue,
    }: Pick<FormikProps<any>, "values" | "setFieldValue">
  ) {
    // auto-complete field name
    setFieldValue("companyName", companyInfos?.name || "");

    // auto-complete field address
    setFieldValue("address", companyInfos?.address || "");

    // auto-complete field gerepId
    setFieldValue("gerepId", companyInfos?.installation?.codeS3ic || "");

    // auto-complete field codeNaf
    setFieldValue("codeNaf", companyInfos?.naf || "");

    // auto-complete companyTypes
    if (companyInfos && companyInfos.installation) {
      let categories = companyInfos.installation.rubriques
        .filter(r => !!r.category) // null blocks form submitting
        .map(r => r.category);
      const companyTypes = categories.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      const currentValue = values.companyTypes;
      setFieldValue("companyTypes", [...currentValue, ...companyTypes]);
    }

    setToggleForm(!!companyInfos);
  }

  function isTransporter(companyTypes) {
    return companyTypes.includes(_CompanyType.Transporter);
  }

  function isTrader(companyTypes) {
    return companyTypes.includes(_CompanyType.Trader);
  }

  /**
   * Form submission callback
   * @param values form values
   */
  async function onSubmit(values: Values) {
    const {
      address,
      isAllowed,
      document,
      transporterReceiptNumber,
      transporterReceiptValidity,
      transporterReceiptDepartment,
      traderReceiptNumber,
      traderReceiptValidity,
      traderReceiptDepartment,
      ...companyInput
    } = values;

    let documentKeys = [] as string[];

    if (document) {
      // upload files if any

      const { name: fileName, type: fileType } = document;

      // Retrieves a signed URL

      const { data } = await createUploadLink({
        variables: { fileName, fileType },
      });

      if (data) {
        // upload file to signed URL
        const uploadLink = data.createUploadLink;
        await fetch(uploadLink.signedUrl, {
          method: "PUT",
          body: document,
          headers: {
            "Content-Type": fileType,
            "x-amz-acl": "private",
          },
        });
        documentKeys = [uploadLink.key];
      }
    }

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

    await createCompany({
      variables: {
        companyInput: {
          ...companyInput,
          documentKeys,
          transporterReceiptId,
          traderReceiptId,
        },
      },
    });

    history.push("/dashboard");
  }

  return (
    <div className="panel">
      <Formik<Values>
        initialValues={{
          siret: "",
          companyName: "",
          address: "",
          companyTypes: [],
          gerepId: "",
          codeNaf: "",
          document: null,
          isAllowed: false,
          transporterReceiptNumber: "",
          transporterReceiptValidity: "",
          transporterReceiptDepartment: "",
          traderReceiptNumber: "",
          traderReceiptValidity: "",
          traderReceiptDepartment: "",
        }}
        validate={values => {
          // whether or not one of the transporter receipt field is set
          const anyTransporterReceipField =
            !!values.transporterReceiptNumber ||
            !!values.transporterReceiptValidity ||
            !!values.transporterReceiptDepartment;

          const isTransporter_ = isTransporter(values.companyTypes);

          // whether or not one of the transporter receipt field is set
          const anyTraderReceipField =
            !!values.traderReceiptNumber ||
            !!values.traderReceiptValidity ||
            !!values.traderReceiptDepartment;

          const isTrader_ = isTrader(values.companyTypes);

          return {
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
          };
        }}
        onSubmit={onSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className={styles.companyAddForm}>
            <h5 className={styles.subtitle}>Identification</h5>
            <AccountCompanyAddSiret
              {...{
                values,
                onCompanyInfos: companyInfo =>
                  onCompanyInfos(companyInfo, { values, setFieldValue }),
              }}
            />
            {toggleForm && (
              <>
                <div className={styles.field}>
                  <label className={`text-right ${styles.bold}`}>
                    Nom de l'entreprise
                  </label>
                  <div className={styles.field__value}>
                    <Field
                      type="text"
                      name="companyName"
                      className={styles.textField}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={`text-right ${styles.bold}`}>
                    Code NAF
                  </label>
                  <div className={styles.field__value}>
                    <Field
                      type="text"
                      name="codeNaf"
                      className={styles.textField}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={`text-right ${styles.bold}`}>Adresse</label>
                  <div className={styles.field__value}>
                    <Field
                      type="text"
                      name="address"
                      className={styles.textField}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={`text-right ${styles.bold}`}>
                    Justificatif (optionnel)
                  </label>

                  <div className={styles.field__value}>
                    <input
                      type="file"
                      className={`button ${styles.textField}`}
                      accept="image/png, image/jpeg, image/gif, application/pdf "
                      onChange={async event => {
                        const file = event.currentTarget.files?.item(0);
                        if (!!file) {
                          setFieldValue("document", file);
                        }
                      }}
                    />
                    <div className={styles.smaller}>
                      KBIS, justificatif du siège social de l'entreprise... Ce
                      document est suceptible d'être vérifié par l'équipe
                      Trackdéchets afin de lutter contre la fraude. Formats
                      acceptés: jpeg, png, pdf.
                    </div>
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

                <div className={styles.field}>
                  <label className={`text-right ${styles.bold}`}>
                    Identifiant GEREP (optionnel)
                  </label>
                  <div className={styles.field__value}>
                    <Field
                      type="text"
                      name="gerepId"
                      className={styles.textField}
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

                <div className={styles.field}>
                  <div className={styles.field__value}>
                    <label>
                      <Field type="checkbox" name="isAllowed" />
                      Je certifie disposer du pouvoir pour créer un compte au
                      nom de mon entreprise
                    </label>

                    <RedErrorMessage name="isAllowed" />
                  </div>
                </div>

                <div className={styles["submit-form"]}>
                  <button
                    className="button-outline primary"
                    disabled={isSubmitting}
                    onClick={() => {
                      history.goBack();
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    className="button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <FaHourglassHalf /> : "Créer"}
                  </button>
                </div>
                {/* // ERRORS */}
                {uploadError && <NotificationError apolloError={uploadError} />}
                {createTransporterReceiptError && (
                  <NotificationError
                    apolloError={createTransporterReceiptError}
                  />
                )}
                {createTraderReceiptError && (
                  <NotificationError apolloError={createTraderReceiptError} />
                )}
                {savingError && <NotificationError apolloError={savingError} />}
              </>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}
