import * as React from "react";
import { useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  Bsff,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
} from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { SIGN_BSFF } from "form/bsff/utils/queries";
import { SignBsff } from "./SignBsff";
import { GET_BSDS } from "common/queries";

const validationSchema = yup.object({
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignTransportFormProps {
  bsff: Bsff;
  onCancel: () => void;
}

function SignTransportForm({ bsff, onCancel }: SignTransportFormProps) {
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  return (
    <Formik
      initialValues={{
        signatureAuthor: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        await signBsff({
          variables: {
            id: bsff.id,
            type: BsffSignatureType.Transport,
            signature: {
              author: values.signatureAuthor,
              date: new Date().toISOString(),
            },
          },
        });
        onCancel();
      }}
    >
      {() => (
        <Form>
          <p>
            En qualité de <strong>transporteur du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare prendre en charge le déchet.
          </p>
          <div className="form__row">
            <label>
              NOM et prénom du signataire
              <Field
                className="td-input"
                name="signatureAuthor"
                placeholder="NOM Prénom"
              />
            </label>
            <RedErrorMessage name="signatureAuthor" />
          </div>

          {signBsffResult.error && (
            <NotificationError apolloError={signBsffResult.error} />
          )}

          <div className="td-modal-actions">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={onCancel}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={signBsffResult.loading}
            >
              <span>
                {signBsffResult.loading
                  ? "Signature en cours..."
                  : "Signer l'enlèvement"}
              </span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

interface SignTransportProps {
  bsffId: string;
}

export function SignTransport({ bsffId }: SignTransportProps) {
  return (
    <SignBsff title="Signer l'enlèvement" bsffId={bsffId}>
      {({ bsff, onClose }) => (
        <SignTransportForm bsff={bsff} onCancel={onClose} />
      )}
    </SignBsff>
  );
}
