import React from "react";
import { Formik, Form, Field } from "formik";
import RedErrorMessage from "../../../common/components/RedErrorMessage";
import styles from "./AccountCompanyInviteNewUser.module.scss";
import { useMutation, gql } from "@apollo/client";
import AccountCompanyMember from "../../AccountCompanyMember";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationInviteUserToCompanyArgs
} from "codegen-ui";
import toast from "react-hot-toast";
import TdTooltip from "../../../common/components/Tooltip";

type Props = {
  company: CompanyPrivate;
};

AccountFormCompanyInviteNewUser.fragments = {
  company: gql`
    fragment AccountFormCompanyInviteNewUserFragment on CompanyPrivate {
      id
      orgId
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
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMember.fragments.user}
`;

const yupSchema = object().shape({
  email: string().email()
});

const roleTooltip =
  "Collaborateur : A accès aux information de l'établissement" +
  " Peut éditer et signer des bordereaux pour le compte de l'établissement." +
  " Peut également exporter le registre de l'établissement\n" +
  "Administrateur : Dispose des mêmes droits que le collaborateur." +
  " Peut en plus modifier les informations de l'établissement et inviter" +
  " de nouveaux collaborateurs.";

export default function AccountFormCompanyInviteNewUser({ company }: Props) {
  const [inviteUserToCompany, { loading }] = useMutation<
    Pick<Mutation, "inviteUserToCompany">,
    MutationInviteUserToCompanyArgs
  >(INVITE_USER_TO_COMPANY, {
    onCompleted: () => {
      toast.success("Invitation envoyée", { duration: 5 });
    },
    onError: () => {
      toast.error(
        "L'invitation n'a pas pu être envoyée. Veuillez réessayer dans quelques minutes.",
        {
          duration: 5
        }
      );
    }
  });

  return (
    <Formik
      initialValues={{ email: "", siret: company.orgId, role: UserRole.Member }}
      validate={values => {
        if (!values.email) {
          return { email: "L'email est obligatoire" };
        }
        return {};
      }}
      onSubmit={(values, { setSubmitting, setFieldError, resetForm }) => {
        inviteUserToCompany({
          variables: values
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
              className="td-input"
              placeholder="Email de la personne à inviter"
            />

            <Field component="select" name="role" className="td-select">
              <option value={UserRole.Member}>Collaborateur</option>
              <option value={UserRole.Admin}>Administrateur</option>
            </Field>
            <div className={styles.roleTooltip}>
              <TdTooltip msg={roleTooltip} />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
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
