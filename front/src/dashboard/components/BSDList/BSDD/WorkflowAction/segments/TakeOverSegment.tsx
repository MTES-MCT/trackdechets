import React, { useState } from "react";
import { useMutation, gql, useQuery } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import {
  Mutation,
  MutationTakeOverSegmentArgs,
  QueryFormArgs,
  Query,
} from "generated/graphql/types";
import { IconBusTransfer } from "common/components/Icons";
import ActionButton from "common/components/ActionButton";
import TdModal from "common/components/Modal";
import {
  NotificationError,
  SimpleNotificationError,
  InlineError,
} from "Apps/common/Components/Error/Error";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { WorkflowActionProps } from "../WorkflowAction";
import { GET_BSDS } from "Apps/common/queries";
import { Loader } from "Apps/common/Components";
import { GET_FORM } from "form/bsdd/utils/queries";

const TAKE_OVER_SEGMENT = gql`
  mutation takeOverSegment($id: ID!, $takeOverInfo: TakeOverInput!) {
    takeOverSegment(id: $id, takeOverInfo: $takeOverInfo) {
      id
    }
  }
`;

interface TakeOverSegmentModalProps {
  formId: string;
  onClose: () => void;
}

function TakeOverSegmentModal({ formId, onClose }: TakeOverSegmentModalProps) {
  const {
    loading: formLoading,
    error: formError,
    data,
  } = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: formId,
      readableId: null,
    },
    fetchPolicy: "no-cache",
  });
  const initialValues = {
    takenOverBy: "",
    takenOverAt: new Date().toISOString(),
  };
  const [takeOverSegment, { loading, error }] = useMutation<
    Pick<Mutation, "takeOverSegment">,
    MutationTakeOverSegmentArgs
  >(TAKE_OVER_SEGMENT, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      onClose();
      cogoToast.success("La prise en charge du bordereau est validée", {
        hideAfter: 5,
      });
    },
    onError: () => {
      // The error is handled in the UI
    },
  });
  if (formLoading) return <Loader />;
  if (formError) return <InlineError apolloError={formError} />;
  if (!data?.form) {
    return (
      <SimpleNotificationError message="Impossible de charger le bordereau" />
    );
  }
  const transportSegments = data.form.transportSegments!;
  const segment = transportSegments[transportSegments.length - 1];
  return (
    <TdModal isOpen onClose={() => onClose} ariaLabel="Prendre en charge">
      <h2 className="td-modal-title">Prendre en charge le déchet</h2>
      <Formik
        initialValues={initialValues}
        onSubmit={values => {
          const variables = {
            takeOverInfo: { ...values },
            id: segment.id,
          };

          takeOverSegment({ variables });
        }}
      >
        {({ values }) => (
          <FormikForm>
            <div className="form__row">
              <label>
                Nom du responsable
                <Field
                  type="text"
                  name="takenOverBy"
                  placeholder="NOM Prénom"
                  className="td-input"
                />
              </label>
            </div>
            <div className="form__row">
              <label>
                Date de prise en charge
                <Field
                  component={DateInput}
                  name="takenOverAt"
                  className="td-input"
                />
              </label>
            </div>
            {error && <NotificationError apolloError={error} />}

            <div className="form__actions">
              <button
                type="button"
                className="button warning"
                onClick={onClose}
              >
                Annuler
              </button>
              <button className="btn btn--primary" type="submit">
                Valider
              </button>
            </div>
          </FormikForm>
        )}
      </Formik>
      {loading && <Loader />}
    </TdModal>
  );
}
export function TakeOverSegment({ form }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ActionButton
        icon={<IconBusTransfer size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Prendre en charge le déchet
      </ActionButton>
      {isOpen && (
        <TakeOverSegmentModal
          formId={form.id}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
