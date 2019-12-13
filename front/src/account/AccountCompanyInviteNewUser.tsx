import React from "react";
import { Formik, Form, Field } from "formik";
import gql from "graphql-tag";
import RedErrorMessage from "../common/RedErrorMessage";
import { Company } from "./AccountCompany";
import styles from "./AccountCompanyInviteNewUser.module.scss";

type Props = {
  company: Company;
};

AccountCompanyInviteNewUser.fragments = {
  company: gql`
    fragment AccountCompanyInviteNewUserFragment on CompanyPrivate {
      siret
    }
  `
};

export default function AccountCompanyInviteNewUser({ company }: Props) {
  return (
    <Formik
      initialValues={{ email: "", siret: company.siret, role: "MEMBER" }}
      validate={(values: any) => {
        let errors: any = {};
        if (!values.email) {
          errors.email = "L'email est obligatoire";
        }
        return errors;
      }}
      onSubmit={(values, { setSubmitting, resetForm }) => {
        console.log("submit");
      }}
    >
      {({ isSubmitting }) => (
        <>
          <Form className={styles["invite-form"]}>
            <Field
              type="email"
              name="email"
              placeholder="Email de la personne à inviter"
            />
            <Field component="select" name="role">
              <option value="MEMBER">Collaborateur</option>
              <option value="ADMIN">Administrateur</option>
            </Field>
            <button type="submit" className="button" disabled={isSubmitting}>
              Inviter
            </button>
          </Form>
          <RedErrorMessage name="email" />
        </>
      )}
    </Formik>
  );
}
