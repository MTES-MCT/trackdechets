import * as React from "react";
import { Formik, Form, Field } from "formik";
import toast from "react-hot-toast";
import { gql, useMutation } from "@apollo/client";
import { Mutation, MutationAnonymizeUserArgs } from "@td/codegen-ui";
import { DsfrNotificationError } from "../../Apps/common/Components/Error/Error";
import RedErrorMessage from "../../common/components/RedErrorMessage";
import { TOAST_DURATION } from "../../common/config";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

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
    <div>
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
        {values => (
          <Form>
            <div className="form__row fr-mt-0 fr-mb-2w">
              <Field name="id">
                {({ field }) => {
                  return (
                    <Input
                      label="Identifiant de base de données du compte à
                          anonymiser et désactiver définitivement"
                      hintText="Attention: action irreversible ! L'utilisateur sera
                            anonymisé et son compte définitivement désactivé."
                      nativeInputProps={{
                        ...field,
                        placeholder: "userId"
                      }}
                      className="fr-col-8"
                    />
                  );
                }}
              </Field>

              <RedErrorMessage name="id" />
            </div>
            <div className="fr-col-8">
              {error && <DsfrNotificationError apolloError={error} />}
            </div>
            <Button
              type="submit"
              priority="primary"
              disabled={loading || !values?.values?.id}
              className="fr-mt-2w"
            >
              {loading ? "Suppression en cours..." : "Supprimer"}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AnonymizeUser;
