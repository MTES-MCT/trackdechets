import React from "react";
import { Formik } from "formik";
import { Loader } from "../../../../../Apps/common/Components";
import {
  FormStatus,
  Mutation,
  MutationMarkAsProcessedArgs,
  ProcessedFormInput
} from "@td/codegen-ui";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "../../../../../Apps/common/queries/fragments";
import ProcessedInfo from "./ProcessedInfo";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { GET_BSDS } from "../../../../../Apps/common/queries";
import toast from "react-hot-toast";

const MARK_AS_PROCESSED = gql`
  mutation MarkAsProcessed($id: ID!, $processedInfo: ProcessedFormInput!) {
    markAsProcessed(id: $id, processedInfo: $processedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

function MarkAsProcessedModalContent({ data, onClose }) {
  const [markAsProcessed, { loading, error }] = useMutation<
    Pick<Mutation, "markAsProcessed">,
    MutationMarkAsProcessedArgs
  >(MARK_AS_PROCESSED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: data => {
      if (
        data.markAsProcessed &&
        data.markAsProcessed.status === FormStatus.Processed
      ) {
        toast.success(
          `Le traitement du déchet a bien été validé. Vous pouvez retrouver ce bordereau dans l'onglet "Archives".`
        );
      }
    },
    onError: () => {
      // The error is handled in the UI
    }
  });

  return (
    <>
      {data === null && <Loader />}

      {!!data?.form && (
        <div>
          <Formik<ProcessedFormInput>
            initialValues={{
              processingOperationDone: "",
              destinationOperationMode: undefined,
              processingOperationDescription: "",
              processedBy: "",
              processedAt: new Date().toISOString(),
              nextDestination: null,
              noTraceability: null
            }}
            onSubmit={async ({ nextDestination, ...values }) => {
              const { errors } = await markAsProcessed({
                variables: {
                  id: data?.form.id,
                  processedInfo: {
                    ...values,
                    nextDestination
                  }
                }
              });
              if (!errors) {
                onClose();
              }
            }}
          >
            <ProcessedInfo form={data.form} close={onClose} />
          </Formik>
          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
          {loading && <Loader />}
        </div>
      )}
    </>
  );
}

export default MarkAsProcessedModalContent;
