import * as React from "react";
import { Formik } from "formik";
import { useMutation, gql } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  Form,
  Mutation,
  MutationSignedByTransporterArgs,
  SignatureAuthor,
} from "generated/graphql/types";
import { Stepper, StepperItem, Modal, Loader } from "common/components";
import steps from "./steps";
import * as yup from "yup";
import { GET_BSDS } from "common/queries";

const SIGNED_BY_TRANSPORTER = gql`
  mutation SignedByTransporter(
    $id: ID!
    $signingInfo: TransporterSignatureFormInput!
  ) {
    signedByTransporter(id: $id, signingInfo: $signingInfo) {
      id
      wasteDetails {
        onuCode
        packagings
        quantity
      }
      status
      sentAt
    }
  }
`;

interface SignedByTransporterModalProps {
  form: Form;
  onClose: () => void;
}

export function SignedByTransporterModal({
  form,
  onClose,
}: SignedByTransporterModalProps) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [signedByTransporter, { error, loading }] = useMutation<
    Pick<Mutation, "signedByTransporter">,
    MutationSignedByTransporterArgs
  >(SIGNED_BY_TRANSPORTER, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      cogoToast.success("La prise en charge du bordereau est validée", {
        hideAfter: 5,
      });
      onClose();
    },
  });

  const { Component } = steps[stepIndex];

  const validationSchema = yup.object({
    securityCode: yup
      .string()
      .required("Le code de signature est obligatoire")
      .matches(/[1-9][0-9]{3}/, "Format invalide"),
    sentBy: yup
      .string()
      .required("Le nom et prénom du contact est obligatoire"),
  });

  return (
    <Modal isOpen onClose={onClose} ariaLabel="Signer l'enlèvement">
      <h2 className="td-modal-title">Signature</h2>

      <Stepper>
        {steps.map((step, index) => (
          <StepperItem
            key={index}
            variant={
              index === stepIndex
                ? "active"
                : stepIndex > index
                ? "complete"
                : "normal"
            }
            onClick={() => setStepIndex(index)}
          >
            {step.title}
          </StepperItem>
        ))}
      </Stepper>

      <div className="step-content">
        <Formik
          initialValues={{
            sentAt: new Date().toISOString(),
            sentBy: "",
            securityCode: "",
            signedByTransporter: false,
            signedByProducer: false,
            signatureAuthor: SignatureAuthor.Emitter,
            packagingInfos: form.stateSummary?.packagingInfos,
            quantity: form.stateSummary?.quantity ?? 0,
            onuCode: form.stateSummary?.onuCode ?? "",
          }}
          validationSchema={validationSchema}
          onSubmit={values =>
            signedByTransporter({
              variables: {
                id: form.id,
                signingInfo: {
                  ...values,
                  securityCode: parseInt(values.securityCode, 10),
                },
              },
            })
          }
        >
          {({ handleSubmit, isSubmitting }) => (
            <Component
              form={form}
              onPrevious={() =>
                setStepIndex(currentStepIndex =>
                  Math.max(0, currentStepIndex - 1)
                )
              }
              onNext={
                stepIndex === steps.length - 1
                  ? handleSubmit
                  : () =>
                      setStepIndex(currentStepIndex =>
                        Math.min(steps.length - 1, currentStepIndex + 1)
                      )
              }
              onCancel={onClose}
              error={error}
              isSubmitting={isSubmitting}
            />
          )}
        </Formik>
      </div>
      {loading && <Loader />}
    </Modal>
  );
}
