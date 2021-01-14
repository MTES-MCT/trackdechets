import { useMutation } from "@apollo/client";
import { Modal, RedErrorMessage } from "common/components";
import { NotificationError } from "common/components/Error";
import { formatISO } from "date-fns";
import { Field, Form, Formik } from "formik";
import { SignatureTypeInput, VhuForm } from "generated/graphql/types";
import React from "react";
import { SIGN_VHU_FORM } from "vhuForm/queries";
import RecipientForm from "./signature/RecipientForm";

type Props = { form: VhuForm; isOpen: boolean; onClose: () => void };

export default function Sign({ form, isOpen, onClose }: Props) {
  const signatureType = getSignatureType(form);
  const [sign, { error }] = useMutation(SIGN_VHU_FORM);

  const additionnalForm = getAdditionalForm(signatureType, form);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Signer le bordereau VHU"
    >
      <h2 className="td-modal-title">Signature [Type {signatureType}]</h2>

      {additionnalForm && (
        <>
          <h3>Champs obligatoires</h3>
          {additionnalForm}
        </>
      )}

      <h3>Signature</h3>
      {error && <NotificationError apolloError={error} />}

      <div>
        <Formik
          initialValues={{
            author: "",
            date: formatISO(new Date(), { representation: "date" }),
          }}
          onSubmit={async values => {
            try {
              await sign({
                variables: {
                  id: form.id,
                  input: {
                    type: signatureType,
                    ...values,
                  },
                },
              });
              onClose();
            } catch (err) {}
          }}
        >
          <Form>
            <div className="form__row">
              <label>
                Signataire
                <Field type="text" name="author" className="td-input" />
              </label>

              <RedErrorMessage name="author" />
            </div>

            <div className="form__row">
              <label>
                Date
                <Field type="date" name="date" className="td-input" />
              </label>

              <RedErrorMessage name="date" />
            </div>

            <div className="form__actions">
              <button
                type="button"
                className="btn btn--outline-primary"
                onClick={onClose}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn--primary">
                Je valide
              </button>
            </div>
          </Form>
        </Formik>
      </div>
    </Modal>
  );
}

function getSignatureType(form: VhuForm) {
  if (form.emitter?.signature?.date == null) {
    return SignatureTypeInput.Emitter;
  }
  if (form.transporter?.signature?.date == null) {
    return SignatureTypeInput.Transporter;
  }
  if (form.recipient?.signature?.date == null) {
    return SignatureTypeInput.Recipient;
  }

  return null;
}

function getAdditionalForm(type: SignatureTypeInput | null, form: VhuForm) {
  switch (type) {
    case SignatureTypeInput.Recipient:
      return <RecipientForm form={form} />;

    case SignatureTypeInput.Transporter:
    case SignatureTypeInput.Emitter:
    default:
      return <></>;
  }
}
