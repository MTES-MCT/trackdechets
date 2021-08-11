import * as React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs,
  Query,
  QueryBsffArgs,
} from "generated/graphql/types";
import {
  ActionButton,
  Modal,
  Loader,
  RedErrorMessage,
  Switch,
} from "common/components";
import { NotificationError } from "common/components/Error";
import DateInput from "form/common/components/custom-inputs/DateInput";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import { IconCheckCircle1 } from "common/components/Icons";
import {
  GET_BSFF_FORM,
  SIGN_BSFF,
  UPDATE_BSFF_FORM,
} from "form/bsff/utils/queries";
import { BsffSummary } from "./BsffSummary";

const validationSchema = yup.object({
  receptionDate: yup.date().required(),
  receptionKilos: yup.number().required(),
  receptionRefusal: yup
    .string()
    .nullable()
    .min(1, "Le motif du refus doit être complété"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
});

interface SignReceptionModalProps {
  bsffId: string;
  onClose: () => void;
}

function SignReceptionModal({ bsffId, onClose }: SignReceptionModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });
  const [updateBsff, updateBsffResult] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;
  const title = `Accuser réception`;
  const loading = updateBsffResult.loading || signBsffResult.loading;
  const error = updateBsffResult.error ?? signBsffResult.error;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>
      <BsffSummary bsff={bsff} />
      <Formik
        initialValues={{
          receptionDate:
            bsff.destination?.reception?.date ?? new Date().toISOString(),
          receptionKilos:
            bsff.destination?.reception?.kilos ?? bsff.quantity?.kilos ?? 0,
          receptionRefusal: null,
          signatureAuthor: "",
        }}
        validationSchema={validationSchema}
        onSubmit={async values => {
          await updateBsff({
            variables: {
              id: bsff.id,
              input: {
                destination: {
                  reception: {
                    date: values.receptionDate,
                    kilos: values.receptionKilos,
                    refusal: values.receptionRefusal,
                  },
                },
              },
            },
          });
          await signBsff({
            variables: {
              id: bsff.id,
              type: BsffSignatureType.Reception,
              signature: {
                author: values.signatureAuthor,
                date: values.receptionDate,
              },
            },
          });
          onClose();
        }}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <p>
              En qualité de <strong>destinataire du déchet</strong>, j'atteste
              que les informations ci-dessus sont corrects. En signant ce
              document, je déclare réceptionner le déchet.
            </p>
            <div className="form__row">
              <label>
                Date de réception
                <Field
                  className="td-input"
                  name="receptionDate"
                  component={DateInput}
                />
              </label>
              <RedErrorMessage name="receptionDate" />
            </div>
            <div className="form__row">
              <label>
                Quantité de fluides reçu (en kilo(s))
                <Field
                  className="td-input"
                  name="receptionKilos"
                  component={NumberInput}
                />
              </label>
              <RedErrorMessage name="receptionKilos" />
            </div>
            <div className="form__row">
              <label>
                <Switch
                  label="Le déchet a été refusé"
                  onChange={checked =>
                    setFieldValue("receptionRefusal", checked ? "" : null)
                  }
                  checked={values.receptionRefusal != null}
                />
              </label>
            </div>
            {values.receptionRefusal != null && (
              <div className="form__row">
                <label>
                  <Field
                    as="textarea"
                    className="td-input"
                    name="receptionRefusal"
                    placeholder="Motif du refus"
                  />
                </label>
              </div>
            )}
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
                onClick={onClose}
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
    </Modal>
  );
}

interface SignReceptionProps {
  bsffId: string;
}

export function SignReception({ bsffId }: SignReceptionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer la réception
      </ActionButton>
      {isOpen && (
        <SignReceptionModal bsffId={bsffId} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
