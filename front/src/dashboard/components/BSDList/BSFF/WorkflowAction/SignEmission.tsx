import * as React from "react";
import { useMutation } from "@apollo/client";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import {
  Bsff,
  BsffSignatureType,
  Mutation,
  MutationSignBsffArgs
} from "@td/codegen-ui";
import { RedErrorMessage } from "../../../../../common/components";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { SIGN_BSFF } from "../../../../../form/bsff/utils/queries";
import { SignBsff } from "./SignBsff";
import DateInput from "../../../../../form/common/components/custom-inputs/DateInput";
import { subMonths } from "date-fns";

const validationSchema = yup.object({
  date: yup.date().required("La date d'émission est requise"),
  signatureAuthor: yup
    .string()
    .ensure()
    .min(1, "Le nom et prénom de l'auteur de la signature est requis")
});

interface SignEmissionFormProps {
  bsff: Bsff;
  onCancel: () => void;
}

function SignEmissionForm({ bsff, onCancel }: SignEmissionFormProps) {
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF);

  const TODAY = new Date();

  return (
    <Formik
      initialValues={{
        signatureAuthor: "",
        date: TODAY
      }}
      validationSchema={validationSchema}
      onSubmit={async values => {
        await signBsff({
          variables: {
            id: bsff.id,
            input: {
              type: BsffSignatureType.Emission,
              author: values.signatureAuthor,
              date: values.date.toISOString()
            }
          }
        });
        onCancel();
      }}
    >
      {() => (
        <Form>
          <p>
            En qualité <strong>d'émetteur du déchet</strong>, j'atteste que les
            informations ci-dessus sont correctes. En signant ce document,
            j'autorise le transporteur à prendre en charge le déchet.
          </p>

          <div className="form__row">
            <label>
              Date d'émission
              <div className="td-date-wrapper">
                <Field
                  name="date"
                  component={DateInput}
                  minDate={subMonths(TODAY, 2)}
                  maxDate={TODAY}
                  required
                  className="td-input"
                />
              </div>
            </label>
            <RedErrorMessage name="date" />
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
                {signBsffResult.loading ? "Signature en cours..." : "Signer"}
              </span>
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

interface SignEmissionProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

export function SignEmission({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton
}: SignEmissionProps) {
  return (
    <SignBsff
      title="Signature émetteur"
      bsffId={bsffId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsff, onClose }) => (
        <SignEmissionForm bsff={bsff} onCancel={onClose} />
      )}
    </SignBsff>
  );
}
