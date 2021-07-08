import React from "react";
import { RedErrorMessage, ActionButton } from "common/components";
import { Formik, Field, Form } from "formik";
import {
  Mutation,
  MutationSignBsffArgs,
  BsffSignatureType,
} from "generated/graphql/types";
import { gql, useMutation } from "@apollo/client";
import { Link, generatePath } from "react-router-dom";
import routes from "common/routes";
import { TdModalTrigger } from "common/components/Modal";
import { IconCheckCircle1 } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import { WorkflowActionProps } from "./WorkflowAction";

const SIGN_BSFF = gql`
  mutation SignBsff(
    $id: ID!
    $type: BsffSignatureType!
    $signature: SignatureInput!
  ) {
    signBsff(id: $id, type: $type, signature: $signature) {
      id
      status
    }
  }
`;

export default function SignBsff({
  form,
  siret,
  signatureType,
  label,
  helptext,
}: WorkflowActionProps & {
  signatureType: BsffSignatureType;
  label: string;
  helptext: string;
}) {
  const [signBsff, { error }] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  return (
    <TdModalTrigger
      ariaLabel={label}
      trigger={open => (
        <ActionButton icon={<IconCheckCircle1 size="24px" />} onClick={open}>
          {label}
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <Formik
            initialValues={{
              author: "",
            }}
            onSubmit={async ({ author }) => {
              await signBsff({
                variables: {
                  id: form.id,
                  type: signatureType,
                  signature: {
                    author,
                    date: new Date().toISOString(),
                  },
                },
              });
              close();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div>{helptext}</div>
                <div className="form__row">
                  <label>
                    Nom du signataire
                    <Field
                      type="text"
                      name="author"
                      placeholder="NOM Prénom"
                      className="td-input"
                      required
                    />
                  </label>
                  <RedErrorMessage name="author" />
                </div>

                <div className="form__actions">
                  <button
                    type="button"
                    className="btn btn--outline-primary"
                    onClick={() => {
                      handleReset();
                      close();
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={isSubmitting}
                  >
                    Signer
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {error && (
            <>
              <p className="tw-mt-2 tw-text-red-700">
                Vous devez mettre à jour le bordereau et renseigner les champs
                nécessaires avant de le signer.
              </p>
              <NotificationError className="action-error" apolloError={error} />

              <Link
                to={generatePath(routes.dashboard.bsffs.edit, {
                  siret,
                  id: form.id,
                })}
                className="btn btn--primary"
              >
                Mettre le bordereau à jour pour le signer
              </Link>
            </>
          )}
        </div>
      )}
    />
  );
}
