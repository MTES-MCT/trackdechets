import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { COMPANY_INFOS } from "../form/company/query";
import { useLazyQuery } from "@apollo/react-hooks";
import { FaHourglassHalf } from "react-icons/fa";
import { Company } from "../form/company/CompanySelector";
import styles from "./AccountCompanyAdd.module.scss";
import AccountFieldNotEditable from "./fields/AccountFieldNotEditable";
import CompanyType from "../login/CompanyType";

export default function AccountCompanyAdd() {
  // Disable all inputs except SIRET by default. Once SIRET is set, reverse disabling states
  const [inputsDisabled, setInputsDisabled] = useState(true);
  const [getCompanyInfos, { loading, data, error }] = useLazyQuery(
    COMPANY_INFOS
  );

  const [companyInfos, setCompanyInfos] = useState<Company | null>(null);

  const { values, setFieldValue, handleSubmit, handleChange } = useFormik({
    initialValues: {
      siret: "",
      companyTypes: [],
      gerepId: "",
      codeNaf: "",
      isAllowed: false
    },
    validate: (values: any) => {
      let errors: any = {};
      if (values.siret.replace(/\s/g, "").length !== 14) {
        errors.siret = "Le SIRET doit faire 14 caractères";
      }

      if (values.isAllowed) {
        errors.isAllowed =
          "Vous devez certifier être autorisé à créer ce compte pour votre entreprise";
      }

      return errors;
    },
    onSubmit: (values, { setSubmitting }) => {}
  });

  useEffect(() => {
    if (data && data.companyInfos && companyInfos == null) {
      const infos = data.companyInfos;
      setInputsDisabled(false);
      setCompanyInfos(infos);

      // auto-complete field gerepId
      setFieldValue(
        "gerepId",
        infos.installation ? infos.installation.codeS3ic : ""
      );

      // auto-complete field codeNaf
      setFieldValue("codeNaf", infos.naf);

      // auto-complete companyTypes
      if (infos.installation) {
        let categories = infos.installation.rubriques
          .filter(r => !!r.category) // null blocks form submitting
          .map(r => r.category);
        const companyTypes = categories.filter((value, index, self) => {
          return self.indexOf(value) === index;
        });
        const currentValue = values.companyTypes;
        setFieldValue("companyTypes", [...currentValue, ...companyTypes]);
      }
    }
  }, [data]);

  return (
    <div className="panel">
      <form onSubmit={handleSubmit} className={styles.companyForm}>
        <h5>Pour quelle entreprise voulez-vous créer un compte ?</h5>
        <div className={styles.field}>
          <label>SIRET</label>

          <div className="form__group">
            <input
              type="text"
              name="siret"
              onChange={handleChange}
              value={values.siret}
            />
            <button
              className="button"
              disabled={!inputsDisabled}
              onClick={() => {
                getCompanyInfos({ variables: { siret: values.siret } });
              }}
            >
              {loading ? <FaHourglassHalf /> : "Valider"}
            </button>

            {/* <RedErrorMessage name="siret" /> */}
          </div>
        </div>

        <AccountFieldNotEditable
          label="Nom de l'entreprise"
          name="name"
          value={companyInfos?.name}
        />

        <AccountFieldNotEditable
          label="Adresse"
          name="address"
          value={companyInfos?.address}
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
            {/* <Field name="companyTypes" component={CompanyType} /> */}
          </div>
        </div>

        <div className={styles.field}>
          <label>Code NAF</label>
          <div className="form__group">
            <input
              type="text"
              name="codeNaf"
              onChange={handleChange}
              value={values.codeNaf}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Identifiant GEREP</label>
          <div className="form__group">
            <input
              type="text"
              name="gerepId"
              onChange={handleChange}
              value={values.gerepId}
            />
          </div>
        </div>

        <div className="form__group">
          <label>
            <input
              type="checkbox"
              name="isAllowed"
              onChange={handleChange}
              value={values.isAllowed ? "x" : ""}
            />
            Je certifie disposer du pouvoir pour créer un compte au nom de mon
            entreprise*
          </label>

          {/* <RedErrorMessage name="isAllowed" /> */}
        </div>

        <button className="button" type="submit">
          Créer l'entreprise
        </button>
      </form>
    </div>
  );
}
