import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import {
  ActionButton,
  Modal,
  Loader,
  RedErrorMessage,
} from "common/components";
import { NotificationError } from "common/components/Error";
import { IconCheckCircle1 } from "common/components/Icons";
import { GET_BSFF_FORM, SIGN_BSFF } from "form/bsff/utils/queries";
import { BsffSummary } from "./BsffSummary";

const validationSchema = yup.object({
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignEmissionModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignEmissionModal({ bsffId, onClose }: SignEmissionModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;
  const title = `Signer l'enlèvement`;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>
      <BsffSummary bsff={bsff} />
      <Formik
        initialValues={{
          signatureAuthor: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await signBsff({
            variables: {
              id: bsff.id,
              type: BsffSignatureType.Emission,
              signature: {
                author: values.signatureAuthor,
                date: new Date().toISOString(),
              },
            },
          });
          onClose();
        }}
      >
        {() => (
          <Form>
            <p>
              En qualité <strong>d'émetteur du déchet</strong>, j'atteste que
              les informations ci-dessus sont corrects. En signant ce document,
              j'autorise le transporteur à prendre en charge le déchet.
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
                onClick={onClose}
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
    </Modal>
  );
}

interface SignEmissionProps {
  bsffId: string;
}

export function SignEmission({ bsffId }: SignEmissionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'enlèvement
      </ActionButton>
      {isOpen && (
        <SignEmissionModal bsffId={bsffId} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
