import React from "react";
import { Formik, Form, Field } from "formik";
import gql from "graphql-tag";
import RedErrorMessage from "../../../common/RedErrorMessage";
import styles from "./AccountCompanyInviteNewUser.module.scss";
import { useMutation } from "@apollo/react-hooks";
import AccountCompanyMember from "../../AccountCompanyMember";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationInviteUserToCompanyArgs,
} from "../../../generated/graphql/types";

type Props = {
  company: CompanyPrivate;
};

AccountFormCompanyInviteNewUser.fragments = {
  company: gql`
    fragment AccountFormCompanyInviteNewUserFragment on CompanyPrivate {
      id
      siret
    }
  `,
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
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMember.fragments.user}
`;

const yupSchema = object().shape({
  email: string().email(),
});

export default function AccountFormCompanyInviteNewUser({ company }: Props) {
  const [inviteUserToCompany, { loading }] = useMutation<
    Pick<Mutation, "inviteUserToCompany">,
    MutationInviteUserToCompanyArgs
  >(INVITE_USER_TO_COMPANY);

  return (
    <Formik
      initialValues={{ email: "", siret: company.siret, role: UserRole.Member }}
      validate={values => {
        if (!values.email) {
          return { email: "L'email est obligatoire" };
        }
        return {};
      }}
      onSubmit={(values, { setSubmitting, setFieldError, resetForm }) => {
        inviteUserToCompany({
          variables: { siret: company.siret, ...values },
        })
          .then(() => {
            setSubmitting(false);
            resetForm();
          })
          .catch(e => {
            setFieldError("email", e.message);
            setSubmitting(false);
          });
      }}
      validationSchema={yupSchema}
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
              <option value={UserRole.Member}>Collaborateur</option>
              <option value={UserRole.Admin}>Administrateur</option>
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
