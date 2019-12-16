import React from "react";
import { Formik, Form, Field } from "formik";
import gql from "graphql-tag";
import RedErrorMessage from "../../../common/RedErrorMessage";
import { Company } from "../../AccountCompany";
import styles from "./AccountCompanyInviteNewUser.module.scss";
import { useMutation } from "@apollo/react-hooks";
import AccountCompanyMember from "../../AccountCompanyMember";

type Props = {
  company: Company;
};

AccountFormCompanyInviteNewUser.fragments = {
  company: gql`
    fragment AccountFormCompanyInviteNewUserFragment on CompanyPrivate {
      id
      siret
    }
  `
};

const INVITE_USER_TO_COMPANY = gql`
  mutation InviteUserToCompany(
    $email: String!
    $siret: String!
    $role: UserRole!
  ) {
    inviteUserToCompany(email: $email, siret: $siret, role: $role) {
      id
      users {
        ...AccountCompanyMemberFragment
      }
    }
  }
  ${AccountCompanyMember.fragments.user}
`;

export default function AccountFormCompanyInviteNewUser({ company }: Props) {
  const [inviteUserToCompany, { loading }] = useMutation(
    INVITE_USER_TO_COMPANY
  );

  return (
    <Formik
      initialValues={{ email: "", siret: company.siret, role: "MEMBER" }}
      validate={values => {
        if (!values.email) {
          return { email: "L'email est obligatoire" };
        }
        return {};
      }}
      onSubmit={(values, { setSubmitting, setFieldError, resetForm }) => {
        inviteUserToCompany({
          variables: { siret: company.siret, ...values }
        })
          .then(() => {
            setSubmitting(false);
            resetForm();
          })
          .catch(() => {
            setFieldError("email", "Erreur serveur");
            setSubmitting(false);
          });
      }}
    >
      {({ isSubmitting }) => (
        <div className={styles.invite__form}>
          <Form>
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
            <RedErrorMessage name="email" />
            {loading && <div>Envoi en cours...</div>}
          </Form>
        </div>
      )}
    </Formik>
  );
}
