import * as React from "react";
import { Formik, Form, Field } from "formik";
import toast from "react-hot-toast";
import { gql, useMutation } from "@apollo/client";
import {
  Mutation,
  MutationAddUserToCompanyArgs,
  MutationAnonymizeUserArgs,
  UserRole
} from "@td/codegen-ui";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { TOAST_DURATION } from "../../common/config";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";

const ANONYMIZE_USER = gql`
  mutation anonymizeUser($id: ID!) {
    anonymizeUser(id: $id)
  }
`;

const ADD_USER_TO_COMPANY = gql`
  mutation AddUserToCompany($input: AddUserToCompanyInput!) {
    addUserToCompany(input: $input)
  }
`;

function AnonymizeUser() {
  const [anonymizeUser, { loading, error }] = useMutation<
    Pick<Mutation, "anonymizeUser">,
    MutationAnonymizeUserArgs
  >(ANONYMIZE_USER);

  const [addUserToCompany, { loading: loadingAddUser, error: errorAddUser }] =
    useMutation<
      Pick<Mutation, "addUserToCompany">,
      MutationAddUserToCompanyArgs
    >(ADD_USER_TO_COMPANY);

  return (
    <div>
      <h3 className="fr-h3 fr-mt-4w">Anonymisation d'un compte</h3>
      <Formik
        initialValues={{
          id: ""
        }}
        onSubmit={async (values, { resetForm }) => {
          if (
            !window.confirm(
              `Souhaitez-vous supprimer l'utilisateur ${values.id} ? (action irréversible)`
            )
          ) {
            return;
          }
          const res = await anonymizeUser({ variables: { id: values.id } });
          resetForm();
          !!res?.data?.anonymizeUser
            ? toast.success(
                `Suppression effectuée, notez l'email anonymisé si besoin immédiatement car il sera impossible de le récupérer : ${res?.data?.anonymizeUser}\nNe divulguez cet email à personne !`,
                {
                  duration: 60000
                }
              )
            : toast.error(
                `Cet utilisateur ne peut pas être supprimé, soit il n'existe pas, soit il doit être lié à des applications ou des établissements existants en base de données, tentez de les supprimer si possible et réessayer de supprimer s'il vous plaît.`,
                { duration: TOAST_DURATION }
              );
        }}
      >
        {() => (
          <Form>
            <div className="form__row">
              <label>
                Identifiant (de base de données) du compte à anonymiser et
                désactiver définitivement (
                <b className="tw-bg-orange-500">
                  Attention: action irreversible ! L'utilisateur sera anonymisé
                  et son compte définitivement désactivé.
                </b>
                )
                <Field name="id" placeholder="userId" className="td-input" />
              </label>
              <RedErrorMessage name="id" />
            </div>
            {error && <InlineError apolloError={error} />}
            <button
              type="submit"
              className="btn btn--primary tw-mt-1"
              disabled={loading}
            >
              {loading ? "Suppression en cours..." : "Supprimer"}
            </button>
          </Form>
        )}
      </Formik>

      <h3 className="fr-h3 fr-mt-4w">
        Ajout d'un utilisateur à une entreprise
      </h3>
      <form
        onSubmit={async e => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          try {
            await addUserToCompany({
              variables: {
                input: {
                  email: (formData.get("email") as string) ?? "",
                  role: (formData.get("role") as UserRole) ?? UserRole.Admin,
                  orgId: (formData.get("orgId") as string) ?? ""
                }
              }
            });
            toast.success(`Utilisateur ajouté à l'entreprise`);
          } catch (err) {
            console.log(err);
            toast.error(`Une erreur s'est produite: ${errorAddUser?.message}`);
          }
        }}
      >
        <Input
          label="Email"
          className="fr-col-4"
          nativeInputProps={{
            required: true,
            name: "email",
            placeholder: "my@email.com"
          }}
        />

        <Select
          label="Rôle"
          className="fr-col-3 fr-mb-5v"
          nativeSelectProps={{
            name: "role",
            defaultValue: UserRole.Admin
          }}
        >
          <option value={UserRole.Admin}>Administrateur</option>
          <option value={UserRole.Member}>Collaborateur</option>
          <option value={UserRole.Reader}>Lecteur</option>
          <option value={UserRole.Driver}>Chauffeur</option>
        </Select>

        <Input
          label="SIRET de l'entreprise"
          className="fr-col-4"
          hintText="Ou Vat number"
          nativeInputProps={{
            required: true,
            name: "orgId",
            placeholder: "XXXXXXXXXXXXXX"
          }}
        />

        <Button disabled={loadingAddUser}>Ajouter</Button>
      </form>
    </div>
  );
}

export default AnonymizeUser;
