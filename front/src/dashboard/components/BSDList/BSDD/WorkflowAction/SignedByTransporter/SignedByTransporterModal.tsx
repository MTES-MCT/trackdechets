import * as React from "react";
import { Formik } from "formik";
import { useMutation, gql } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  Form,
  Mutation,
  MutationSignedByTransporterArgs,
  SignatureAuthor,
  TransporterSignatureFormInput,
} from "generated/graphql/types";
import { Stepper, StepperItem, Modal } from "common/components";
import steps from "./steps";
import * as yup from "yup";

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
  const [signedByTransporter, { error }] = useMutation<
    Pick<Mutation, "signedByTransporter">,
    MutationSignedByTransporterArgs
  >(SIGNED_BY_TRANSPORTER, {
    onCompleted: () => {
      cogoToast.success("La prise en charge du bordereau est validée", {
        hideAfter: 5,
      });
      onClose();
    },
  });

  const { Component } = steps[stepIndex];

  const validationSchema = yup.object({
    securityCode: yup.number().required("Le code de signature est obligatoire"),
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
          initialValues={
            {
              sentAt: new Date().toISOString(),
              sentBy: "",

              // an input[type=number]'s empty value is a string
              // but it's becoming a number when it's filled
              securityCode: "" as unknown,

              signedByTransporter: false,
              signedByProducer: false,
              signatureAuthor: SignatureAuthor.Emitter,
              packagingInfos: form.stateSummary?.packagingInfos,
              quantity: form.stateSummary?.quantity ?? "",
              onuCode: form.stateSummary?.onuCode ?? "",
            } as TransporterSignatureFormInput
          }
          validationSchema={validationSchema}
          onSubmit={values =>
            signedByTransporter({
              variables: {
                id: form.id,
                signingInfo: values,
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
    </Modal>
  );
}
