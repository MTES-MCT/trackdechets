import { useLazyQuery, useMutation } from "@apollo/react-hooks";
import { Field, Formik, useFormikContext, Form } from "formik";
import gql from "graphql-tag";
import React, { useEffect, useState } from "react";
import { FaHourglassHalf } from "react-icons/fa";
import RedErrorMessage from "../common/RedErrorMessage";
import { Company } from "../form/company/CompanySelector";
import { COMPANY_INFOS } from "../form/company/query";
import CompanyType from "../login/CompanyType";
import styles from "./AccountCompanyAdd.module.scss";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import Loader from "../common/Loader";
import { useHistory } from "react-router-dom";

const CREATE_COMPANY = gql`
  mutation CreateCompany($companyInput: PrivateCompanyInput!) {
    createCompany(companyInput: $companyInput) {
      id
    }
  }
`;

export default function AccountCompanyAdd() {
  const [
    createCompany,
    { loading: savingCompany, error: savingError }
  ] = useMutation(CREATE_COMPANY);
  const [getCompanyInfos, { loading, data, error }] = useLazyQuery(
    COMPANY_INFOS
  );

  const [companyInfos, setCompanyInfos] = useState<Company | null>(null);

  useEffect(() => {
    if (data?.companyInfos != null) {
      setCompanyInfos(data.companyInfos);
    }
  }, [data]);

  const history = useHistory();

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
        onSubmit={(values, { setSubmitting }) => {
          createCompany({ variables: { companyInput: values } }).then(_ => {
            setSubmitting(false);
            history.push("");
          });
        }}
      >
        {({ values, isSubmitting }) => (
          <Form className={styles.companyForm}>
            <h5>Pour quelle entreprise voulez-vous créer un compte ?</h5>
            <div className={styles.field}>
              <label>SIRET</label>

              <div className="form__group">
                <Field type="text" name="siret" />
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    if (values.siret.replace(/\s/g, "").length !== 14) {
                      return;
                    }
                    getCompanyInfos({ variables: { siret: values.siret } });
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
      const currentValue = values.companyTypes;
      setFieldValue("companyTypes", [...currentValue, ...companyTypes]);
    }
  }, [companyInfos, setFieldValue]);

  return null;
};
