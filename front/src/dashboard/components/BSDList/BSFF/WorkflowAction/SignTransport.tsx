import * as React from "react";
import { useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  Bsff,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs,
  MutationUpdateBsffArgs,
  TransportMode
} from "@td/codegen-ui";
import { RedErrorMessage } from "../../../../../common/components";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import {
  SIGN_BSFF,
  UPDATE_BSFF_FORM
} from "../../../../../form/bsff/utils/queries";
import { SignBsff } from "./SignBsff";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import TransporterRecepisseWrapper from "../../../../../form/common/components/company/TransporterRecepisseWrapper";
import { subMonths } from "date-fns";
import TagsInput from "../../../../../common/components/tags-input/TagsInput";

const validationSchema = yup.object({
  takenOverAt: yup.date().required("La date de prise en charge est requise"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis")
});

interface SignTransportFormProps {
  bsff: Bsff;
  onCancel: () => void;
}

function SignTransportForm({ bsff, onCancel }: SignTransportFormProps) {
  const [updateBsff, updateBsffResult] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);

  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const TODAY = new Date();

  return (
    <Formik
      initialValues={{
        signatureAuthor: "",
        takenOverAt: TODAY.toISOString(),
        transporterTransportPlates: bsff.transporter?.transport?.plates
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        await updateBsff({
          variables: {
            id: bsff.id,
            input: {
              transporter: {
                transport: {
                  takenOverAt: values.takenOverAt,
                  plates: values.transporterTransportPlates,
                  mode: bsff.transporter?.transport?.mode ?? TransportMode.Road
                }
              }
            }
          }
        });
        await signBsff({
          variables: {
            id: bsff.id,
            input: {
              type: BsffSignatureType.Transport,
              author: values.signatureAuthor,
              date: values.takenOverAt
            }
          }
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
          <TransporterRecepisseWrapper transporter={bsff.transporter!} />

          {!bsff.transporter?.transport?.mode ||
            (bsff.transporter?.transport?.mode === TransportMode.Road && (
              <div className="form__row">
                <label htmlFor="transporterTransportPlates">
                  Immatriculations
                </label>
                <TagsInput name="transporterTransportPlates" />
              </div>
            ))}

          <div className="form__row">
            <label>
              Date de prise en charge
              <div className="td-date-wrapper">
                <Field
                  name="takenOverAt"
                  component={DateInput}
                  className="td-input"
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
                />
              </div>
            </label>
            <RedErrorMessage name="takenOverAt" />
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
                {updateBsffResult.loading || signBsffResult.loading
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
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

export function SignTransport({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: SignTransportProps) {
  return (
    <SignBsff
      title="Signer l'enlèvement"
      bsffId={bsffId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsff, onClose }) => (
        <SignTransportForm bsff={bsff} onCancel={onClose} />
      )}
    </SignBsff>
  );
}
