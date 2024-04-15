import React from "react";
import { Formik, Form, Field } from "formik";
import RedErrorMessage from "../../../../common/components/RedErrorMessage";
import styles from "./AccountCompanyInviteNewUser.module.scss";
import { useMutation, gql } from "@apollo/client";
import { AccountCompanyMemberFragment } from "../../../Companies/common/fragments";
import { object, string } from "yup";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationInviteUserToCompanyArgs
} from "@td/codegen-ui";
import toast from "react-hot-toast";
import TdTooltip from "../../../../common/components/Tooltip";
import { TOAST_DURATION } from "../../../../common/config";

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
  ${AccountCompanyMemberFragment.user}
`;

const yupSchema = object().shape({
  email: string().email()
});

const roleTooltip = role => {
  switch (role) {
    case UserRole.Admin:
      return "Administrateur : a tous les droits liés à la gestion des bordereaux ainsi que la gestion de l'établissement dont l'ajout de nouveaux membres.";
    case UserRole.Member:
      return "Collaborateur : a tous les droits liés à la gestion des bordereaux uniquement, export du registre et peut consulter les informations de l'établissement.";
    case UserRole.Driver:
      return "Chauffeur : a uniquement la possibilité de consulter et de signer des bordereaux dans son onglet À collecter, et de voir les bordereaux dans son onglet Collecté (QR code contrôle routier).";
    case UserRole.Reader:
      return "Lecteur : a uniquement des droits de consultation sur les bordereaux ainsi que sur les informations de l'établissement.";
  }
};

export default function AccountFormCompanyInviteNewUser({ company }: Props) {
  const [inviteUserToCompany, { loading }] = useMutation<
    Pick<Mutation, "inviteUserToCompany">,
    MutationInviteUserToCompanyArgs
  >(INVITE_USER_TO_COMPANY, {
    onCompleted: () => {
      toast.success("Invitation envoyée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "L'invitation n'a pas pu être envoyée. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
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
      {({ isSubmitting, values }) => (
        <div className={styles.invite__form}>
          <Form>
            <Field
              type="email"
              name="email"
              className="td-input"
              placeholder="Email de la personne à inviter"
            />

            <Field component="select" name="role" className="td-select">
              <option value={UserRole.Admin}>Administrateur</option>
              <option value={UserRole.Member}>Collaborateur</option>
              <option value={UserRole.Reader}>Lecteur</option>
              <option value={UserRole.Driver}>Chauffeur</option>
            </Field>
            <div className={styles.roleTooltip}>
              <TdTooltip msg={roleTooltip(values.role)} />
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
