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
} from "generated/graphql/types";
import { RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { SIGN_BSFF, UPDATE_BSFF_FORM } from "form/bsff/utils/queries";
import { SignBsff } from "./SignBsff";
import { GET_BSDS } from "common/queries";
import { subMonths } from "date-fns";

const getValidationSchema = (today: Date) =>
  yup.object({
    receptionDate: yup
      .date()
      .required("La date de réception est requise")
      .max(today, "La date de réception ne peut être dans le futur")
      .min(
        subMonths(today, 2),
        "La date de réception ne peut être antérieure à 2 mois"
      ),
    signatureAuthor: yup
      .string()
      .ensure()
      .min(1, "Le nom et prénom de l'auteur de la signature est requis"),
  });

interface SignReceptionModalProps {
  bsff: Bsff;
  onCancel: () => void;
}

function SignReceptionModal({ bsff, onCancel }: SignReceptionModalProps) {
  const [updateBsff, updateBsffResult] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM);
  const [signBsff, signBsffResult] = useMutation<
    Pick<Mutation, "signBsff">,
    MutationSignBsffArgs
  >(SIGN_BSFF, { refetchQueries: [GET_BSDS], awaitRefetchQueries: true });

  const TODAY = new Date();
  const validationSchema = getValidationSchema(TODAY);

  const loading = updateBsffResult.loading || signBsffResult.loading;
  const error = updateBsffResult.error ?? signBsffResult.error;

  return (
    <Formik
      initialValues={{
        receptionDate: bsff.destination?.reception?.date ?? TODAY.toISOString(),
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
                },
              },
            },
          },
        });
        await signBsff({
          variables: {
            id: bsff.id,
            input: {
              type: BsffSignatureType.Reception,
              author: values.signatureAuthor,
              date: values.receptionDate,
            },
          },
        });
        onCancel();
      }}
    >
      <Form>
        <p>
          En qualité de <strong>destinataire du déchet</strong>, j'atteste que
          les informations ci-dessus sont correctes. En signant ce document, je
          déclare réceptionner le déchet.
        </p>
        <div className="form__row">
          <label>
            Date de réception
            <div className="td-date-wrapper">
              <Field
                className="td-input"
                name="receptionDate"
                component={DateInput}
                minDate={subMonths(TODAY, 2)}
                maxDate={TODAY}
                required
              />
            </div>
          </label>
          <RedErrorMessage name="receptionDate" />
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
          <button type="submit" className="btn btn--primary" disabled={loading}>
            <span>{loading ? "Signature en cours..." : "Signer"}</span>
          </button>
        </div>
      </Form>
    </Formik>
  );
}

interface SignReceptionProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

export function SignReception({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton,
}: SignReceptionProps) {
  return (
    <SignBsff
      title="Signer la réception"
      bsffId={bsffId}
      isModalOpenFromParent={isModalOpenFromParent}
      onModalCloseFromParent={onModalCloseFromParent}
      displayActionButton={displayActionButton}
    >
      {({ bsff, onClose }) => (
        <SignReceptionModal bsff={bsff} onCancel={onClose} />
      )}
    </SignBsff>
  );
}
