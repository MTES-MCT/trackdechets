import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import {
  Form,
  Mutation,
  MutationTakeOverSegmentArgs,
  FormRole,
  FormStatus,
} from "generated/graphql/types";
import { updateApolloCache } from "common/helper";
import { IconBusTransfer } from "common/components/Icons";
import ActionButton from "common/components/ActionButton";
import TdModal from "common/components/Modal";
import { NotificationError } from "common/components/Error";
import DateInput from "form/custom-inputs/DateInput";
import { GET_TRANSPORT_BSDS, GET_FORM } from "../../../transport/queries";
import { WorkflowActionProps } from "./WorkflowAction";

const TAKE_OVER_SEGMENT = gql`
  mutation takeOverSegment($id: ID!, $takeOverInfo: TakeOverInput!) {
    takeOverSegment(id: $id, takeOverInfo: $takeOverInfo) {
      id
    }
  }
`;

export default function TakeOverSegment({ form, siret }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const refetchQuery = {
    query: GET_FORM,
    variables: { id: form.id },
  };
  const [takeOverSegment, { error }] = useMutation<
    Pick<Mutation, "takeOverSegment">,
    MutationTakeOverSegmentArgs
  >(TAKE_OVER_SEGMENT, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("La prise en charge du bordereau est validée", {
        hideAfter: 5,
      });
    },
    refetchQueries: [refetchQuery],
    update: store => {
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_TRANSPORT_BSDS,
        variables: {
          siret,
          roles: [FormRole.Transporter],
          status: [
            FormStatus.Sealed,
            FormStatus.Sent,
            FormStatus.Resealed,
            FormStatus.Resent,
          ],
        },
        getNewData: data => ({
          forms: data.forms,
        }),
      });
    },
  });
  const transportSegments = form.transportSegments!;
  const segment = transportSegments[transportSegments.length - 1];

  const initialValues = {
    takenOverBy: "",
    takenOverAt: new Date().toISOString(),
  };

  return (
    <>
      <ActionButton
        icon={<IconBusTransfer size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Prendre en charge le déchet
      </ActionButton>
      {isOpen && (
        <TdModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          ariaLabel="Prendre en charge"
        >
          <h2 className="td-modal-title">Prendre en charge le déchet</h2>
          <Formik
            initialValues={initialValues}
            onSubmit={values => {
              const variables = {
                takeOverInfo: { ...values },
                id: segment.id,
              };

              takeOverSegment({ variables }).catch(() => {});
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
                    onClick={() => setIsOpen(false)}
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
        </TdModal>
      )}
    </>
  );
}
