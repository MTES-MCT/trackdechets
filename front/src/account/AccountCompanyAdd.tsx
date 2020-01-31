import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import cogoToast from "cogo-toast";
import { Field, Form, Formik, useFormikContext } from "formik";
import gql from "graphql-tag";
import React, { useEffect, useRef, useState } from "react";
import { FaHourglassHalf } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import Loader from "../common/Loader";
import RedErrorMessage from "../common/RedErrorMessage";
import { GET_ME } from "../dashboard/Dashboard";
import { Company } from "../form/company/CompanySelector";
import { COMPANY_INFOS } from "../form/company/query";
import CompanyType from "../login/CompanyType";
import styles from "./AccountCompanyAdd.module.scss";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";

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

export default function AccountCompanyAdd() {
  const history = useHistory();
  const [companyInfos, setCompanyInfos] = useState<Company | null>(null);
  const [uploadedFile, setUploadedFile] = useState();

  const [
    createCompany,
    { loading: savingCompany, error: savingError }
  ] = useMutation(CREATE_COMPANY, {
    update(cache, { data: { createCompany } }) {
      const getMeQuery = cache.readQuery<{ me: any }>({ query: GET_ME });
      if (getMeQuery == null) {
        return;
      }
      const { me } = getMeQuery;
      me.companies = (me.companies || []).push(createCompany);

      cache.writeQuery({
        query: GET_ME,
        data: { me }
      });
    }
  });
  const [getCompanyInfos, { loading, data, error }] = useLazyQuery(
    COMPANY_INFOS
  );

  const [createUploadLink, { data: uploadLinkData }] = useMutation<{
    createUploadLink: { signedUrl: string; key: string };
  }>(CREATE_UPLOAD_LINK);

  useEffect(() => {
    if (data?.companyInfos == null) {
      return;
    }
    if (data.companyInfos.isRegistered) {
      cogoToast.error(
        "Ce SIRET existe déjà dans Trackdéchets, impossible de le re-créer."
      );
      return;
    }

    setCompanyInfos(data.companyInfos);
  }, [data]);

  // Once we have a signed URL to upload to, upload the file and update `uploadLinkData`
  useEffect(() => {
    if (
      !uploadLinkData?.createUploadLink?.signedUrl ||
      uploadedFile.key === uploadLinkData.createUploadLink.key
    ) {
      return;
    }

    fetch(uploadLinkData.createUploadLink.signedUrl, {
      method: "PUT",
      body: uploadedFile.file,
      headers: {
        "Content-Type": uploadedFile.fileType,
        "x-amz-acl": "private"
      }
    }).then(_ =>
      setUploadedFile({
        ...uploadedFile,
        key: uploadLinkData.createUploadLink.key
      })
    );
  }, [uploadLinkData, uploadedFile]);

  if (savingCompany) {
    return <Loader />;
  }

  return (
    <div className="panel">
      {savingError && (
        <div className="notification error">{savingError.message}</div>
      )}

      <Formik
        initialValues={{
          siret: "",
          companyTypes: [],
          gerepId: "",
          codeNaf: "",
          documentKeys: [],
          isAllowed: false
        }}
        validate={values => {
          return {
            ...(values.companyTypes.length === 0 && {
              companyTypes: "Vous devez préciser le type de compagnie"
            }),
            ...(!values.isAllowed && {
              isAllowed:
                "Vous devez certifier être autorisé à créer ce compte pour votre entreprise"
            }),
            ...(values.siret.replace(/\s/g, "").length !== 14 && {
              siret: "Le SIRET doit faire 14 caractères"
            })
          };
        }}
        onSubmit={values => {
          const { isAllowed, ...companyInput } = values;
          createCompany({ variables: { companyInput } }).then(_ => {
            history.push("/dashboard/slips");
          });
        }}
      >
        {({ values, isSubmitting }) => (
          <Form className={styles.companyForm}>
            <h5>
              Commencez par indiquer le SIRET de ce nouvel établissement...
            </h5>
            <div className={styles.field}>
              <label>SIRET*</label>

              <div className="form__group">
                <Field type="text" name="siret" />
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    const trimedSiret = values.siret.replace(/\s/g, "");
                    if (trimedSiret.length !== 14) {
                      return;
                    }
                    getCompanyInfos({ variables: { siret: trimedSiret } });
                  }}
                >
                  {loading ? <FaHourglassHalf /> : "Valider"}
                </button>

                <UpdateSiretRelatedFields companyInfos={companyInfos} />

                <RedErrorMessage name="siret" />
              </div>
            </div>

            {error && <div className="notification error">{error.message}</div>}
            {data && (
              <>
                <AccountFieldNotEditable
                  label="Nom de l'entreprise"
                  name="name"
                  value={companyInfos?.name || "____________"}
                />

                <AccountFieldNotEditable
                  label="Adresse"
                  name="address"
                  value={companyInfos?.address || "____________"}
                />

                {companyInfos?.installation && (
                  <AccountFieldNotEditable
                    label="Installation classée mdresse"
                    name="codeS3ic"
                    value={companyInfos?.installation.codeS3ic}
                  />
                )}

                <h5>Donnez nous un peu plus de détail...</h5>

                <div className={styles.field}>
                  <label>Vous êtes*</label>
                  <div className="form__group">
                    <Field name="companyTypes" component={CompanyType} />

                    <RedErrorMessage name="companyTypes" />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Code NAF</label>
                  <div className="form__group">
                    <Field type="text" name="codeNaf" />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Identifiant GEREP</label>
                  <div className="form__group">
                    <Field type="text" name="gerepId" />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Justificatif</label>
                  <div className="form__group">
                    <p className={styles.formDescription}>
                      Pour nous aider à lutter contre la fraude, joignez un
                      document justifiant de votre légitimité à créer cet
                      établissement dans Trackdéchet (KBIS, justificatif du
                      siège social de l'entreprise, CIN à défaut, ou autre...).
                      Ce document est suceptible d'être vérifié par l'équipe
                      Trackdéchets.
                    </p>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, .pdf"
                      onChange={async event => {
                        const file = event.currentTarget.files?.item(0);
                        if (!file) {
                          return;
                        }
                        const fileParts = file.name.split(".");
                        const fileName = fileParts[0];
                        const fileType = fileParts[1];

                        setUploadedFile({ file, fileName, fileType });
                        createUploadLink({ variables: { fileName, fileType } });
                      }}
                    />

                    <span className={styles.acceptedFormats}>
                      Formats acceptés: jpeg, png, pdf.
                    </span>

                    <UpdateFileField uploadedFile={uploadedFile} />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Validation*</label>
                  <div className="form__group">
                    <label>
                      <Field type="checkbox" name="isAllowed" />
                      Je certifie disposer du pouvoir pour créer un compte au
                      nom de mon entreprise
                    </label>

                    <RedErrorMessage name="isAllowed" />
                  </div>
                </div>

                <button
                  className="button large"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Créer l'entreprise
                </button>
              </>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
}

const UpdateSiretRelatedFields = ({ companyInfos }) => {
  const { values, setFieldValue } = useFormikContext<any>();
  const latestValues = useRef(values);
  useEffect(() => {
    latestValues.current = values;
  });

  useEffect(() => {
    if (companyInfos == null) {
      return;
    }

    // auto-complete field gerepId
    setFieldValue(
      "gerepId",
      companyInfos.installation ? companyInfos.installation.codeS3ic : ""
    );

    // auto-complete field codeNaf
    setFieldValue("codeNaf", companyInfos.naf || "");

    // auto-complete companyTypes
    if (companyInfos.installation) {
      let categories = companyInfos.installation.rubriques
        .filter(r => !!r.category) // null blocks form submitting
        .map(r => r.category);
      const companyTypes = categories.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      const currentValue = latestValues.current.companyTypes;
      setFieldValue("companyTypes", [...currentValue, ...companyTypes]);
    }
  }, [companyInfos, setFieldValue]);

  return null;
};

const UpdateFileField = ({ uploadedFile }) => {
  const { setFieldValue } = useFormikContext<any>();

  useEffect(() => {
    setFieldValue("documentKeys", [uploadedFile?.key].filter(Boolean));
  }, [uploadedFile, setFieldValue]);

  return null;
};
