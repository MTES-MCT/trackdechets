import * as React from "react";
import { Formik, Form, Field } from "formik";
import toast from "react-hot-toast";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationAnonymizeUserArgs } from "@td/codegen-ui";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { TOAST_DURATION } from "../../common/config";

const ANONYMIZE_USER = gql`
  mutation anonymizeUser($id: ID!) {
    anonymizeUser(id: $id)
  }
`;
function AnonymizeUser() {
  const [anonymizeUser, { loading, error }] = useMutation<
    Pick<Mutation, "anonymizeUser">,
    MutationAnonymizeUserArgs
  >(ANONYMIZE_USER);

  return (
    <div className="tw-mx-2">
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
    </div>
  );
}

export default AnonymizeUser;
