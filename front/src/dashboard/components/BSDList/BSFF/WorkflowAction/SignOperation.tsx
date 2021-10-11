import * as React from "react";
import { useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  Bsff,
  BsffOperationCode,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs,
} from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { SIGN_BSFF, UPDATE_BSFF_FORM } from "form/bsff/utils/queries";
import { OPERATION } from "form/bsff/utils/constants";
import { SignBsff } from "./SignBsff";
import { GET_BSDS } from "common/queries";

const validationSchema = yup.object({
  operationCode: yup
    .string()
    .oneOf(
      Object.keys(OPERATION),
      "Le code de traitement doit faire partie de la liste reconnue"
    )
    .required(),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignOperationModalProps {
  bsff: Bsff;
  onCancel: () => void;
}

function SignOperationModal({ bsff, onCancel }: SignOperationModalProps) {
  const [updateBsff, updateBsffResult] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const loading = updateBsffResult.loading || signBsffResult.loading;
  const error = updateBsffResult.error ?? signBsffResult.error;

  return (
    <Formik
      initialValues={{
        operationCode: bsff.destination?.plannedOperationCode ?? "",
        signatureAuthor: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        await updateBsff({
          variables: {
            id: bsff.id,
            input: {
              destination: {
                operation: {
                  code: values.operationCode as BsffOperationCode,
                },
              },
            },
          },
        });
        await signBsff({
          variables: {
            id: bsff.id,
            type: BsffSignatureType.Operation,
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
            En qualité de <strong>destinataire du déchet</strong>, j'atteste que
            les informations ci-dessus sont correctes. En signant ce document,
            je déclare avoir traité le déchet.
          </p>
          <div className="form__row">
            <label>
              Code de traitement
              <Field as="select" name="operationCode" className="td-select">
                <option />
                {Object.values(OPERATION).map(operation => (
                  <option key={operation.code} value={operation.code}>
                    {operation.code} - {operation.description}
                  </option>
                ))}
              </Field>
            </label>
            <RedErrorMessage name="operationCode" />
          </div>
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

          {error && <NotificationError apolloError={error} />}

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
              disabled={loading}
            >
              <span>{loading ? "Signature en cours..." : "Signer"}</span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

interface SignOperationProps {
  bsffId: string;
}

export function SignOperation({ bsffId }: SignOperationProps) {
  return (
    <SignBsff title="Signer le traitement" bsffId={bsffId}>
      {({ bsff, onClose }) => (
        <SignOperationModal bsff={bsff} onCancel={onClose} />
      )}
    </SignBsff>
  );
}
