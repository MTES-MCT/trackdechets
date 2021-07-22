import React from "react";
import { RedErrorMessage, ActionButton } from "common/components";
import { validationSchema, SIGN_BSDASRI } from "./utils";

import { Formik, Field, Form } from "formik";
import {
  Mutation,
  MutationSignBsdasriArgs,
  BsdasriSignatureType,
} from "generated/graphql/types";
import { useMutation } from "@apollo/client";
import { Link, generatePath } from "react-router-dom";
import routes from "common/routes";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";

import { IconCheckCircle1 } from "common/components/Icons";

import { NotificationError } from "common/components/Error";

export default function SignBsdasriDirectTakeover({
  form,
  siret,
}: WorkflowActionProps) {
  const [signBsdasri, { error }] = useMutation<
    Pick<Mutation, "signBsdasri">,
    MutationSignBsdasriArgs
  >(SIGN_BSDASRI);

  return (
    <TdModalTrigger
      ariaLabel="Emport direct"
      trigger={open => (
        <ActionButton icon={<IconCheckCircle1 size="24px" />} onClick={open}>
          Emport direct transporteur
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <Formik
            initialValues={{
              author: "",
            }}
            validationSchema={() => validationSchema(form)}
            onSubmit={values => {
              signBsdasri({
                variables: {
                  id: form.id,
                  input: { ...values, type: BsdasriSignatureType.Transport },
                },
              });
              // close();
            }}
          >
            {({ isSubmitting, handleReset }) => (
              <Form>
                <div>
                  L'émetteur de bordereau a autorisé son emport direct, en tant
                  que transporteur vous pouvez donc emporter le déchet concerné
                </div>
                <div className="form__row">
                  <label>
                    Nom du signataire
                    <Field
                      type="text"
                      name="author"
                      placeholder="NOM Prénom"
                      className="td-input"
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
                to={generatePath(routes.dashboard.bsdasris.edit, {
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
