import * as React from "react";
import { Formik } from "formik";
import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import cogoToast from "cogo-toast";
import {
  Form,
  Mutation,
  MutationSignedByTransporterArgs,
  SignatureAuthor,
  TransporterSignatureFormInput,
} from "generated/graphql/types";
import { Breadcrumb, BreadcrumbItem, Modal } from "common/components";
import steps from "./steps";

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
    }
  }
`;

interface TransportSignatureModalProps {
  form: Form;
  isOpen: boolean;
  onClose: () => void;
}

export function TransportSignatureModal({
  form,
  isOpen,
  onClose,
}: TransportSignatureModalProps) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Signer l'enlèvement">
      <h2 className="td-modal-title">Signature</h2>

      <Breadcrumb>
        {steps.map((step, index) => (
          <BreadcrumbItem
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
          </BreadcrumbItem>
        ))}
      </Breadcrumb>

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
          onSubmit={values =>
            signedByTransporter({
              variables: {
                id: form.id,
                signingInfo: values,
              },
            })
          }
        >
          {({ handleSubmit }) => (
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
            />
          )}
        </Formik>
      </div>
    </Modal>
  );
}
