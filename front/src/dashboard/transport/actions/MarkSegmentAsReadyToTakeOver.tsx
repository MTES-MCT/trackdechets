import { useMutation } from "@apollo/react-hooks";

import gql from "graphql-tag";

import React, { useState } from "react";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "../queries";
import {
  Form,
  FormRole,
  FormStatus,
  Mutation,
  MutationMarkSegmentAsReadyToTakeOverArgs,
  TransportSegment,
} from "generated/graphql/types";
import { Form as FormikForm, Formik } from "formik";
import { segmentFragment } from "common/fragments";
import { updateApolloCache } from "common/helper";
import cogoToast from "cogo-toast";
import { NotificationError } from "common/components/Error";

import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";
import { PaperWriteIcon } from "common/components/Icons";

export const MARK_SEGMENT_AS_READY_TO_TAKE_OVER = gql`
  mutation markSegmentAsReadyToTakeOver($id: ID!) {
    markSegmentAsReadyToTakeOver(id: $id) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

const getSegmentToMarkSegmentAsReadyToTakeOver = ({ form, userSiret }) => {
  const transportSegments: TransportSegment[] = form.transportSegments || [];
  if (form.status !== "SENT") {
    return null;
  }
  if (!transportSegments.length) {
    return null;
  }
  // get unsealed  segments
  const sealableSegments = transportSegments.filter(f => !f.readyToTakeOver);
  if (!sealableSegments.length) {
    return null;
  }

  // is the first unsealed segment is for current user, return it
  return sealableSegments[0].previousTransporterCompanySiret === userSiret
    ? sealableSegments[0]
    : null;
};

type Props = {
  form: Omit<Form, "emitter" | "recipient" | "wasteDetails">;
  userSiret: string;
  inCard?: boolean;
};

export default function MarkSegmentAsReadyToTakeOver({
  form,
  userSiret,
  inCard = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const refetchQuery = {
    query: GET_FORM,
    variables: { id: form.id },
  };
  const [markSegmentAsReadyToTakeOver, { error }] = useMutation<
    Pick<Mutation, "markSegmentAsReadyToTakeOver">,
    MutationMarkSegmentAsReadyToTakeOverArgs
  >(MARK_SEGMENT_AS_READY_TO_TAKE_OVER, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success(
        "Le bordereau est prêt à être pris en charge par le transporteur suivant",
        { hideAfter: 5 }
      );
    },
    refetchQueries: [refetchQuery],
    update: store => {
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_TRANSPORT_SLIPS,
        variables: {
          userSiret,
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

  const segment = getSegmentToMarkSegmentAsReadyToTakeOver({ form, userSiret });

  if (!segment) {
    return null;
  }
  return (
    <>
      {inCard ? (
        <button
          className="btn btn--primary btn--medium-text"
          onClick={() => setIsOpen(true)}
          title="Finaliser pour transférer"
        >
          <span>Finaliser pour transférer</span>
        </button>
      ) : (

        <ActionButton
          title="Finaliser pour transférer"
          icon={PaperWriteIcon}
          onClick={() => setIsOpen(true)}
          iconSize={32}
        />
      )}

      {isOpen ? (
        <TdModal
          isOpen={isOpen}
          ariaLabel="Finaliser un segment"
          onClose={() => setIsOpen(false)}
        >
          <Formik
            initialValues={{}}
            onSubmit={() => {
              const variables = {
                id: segment.id,
              };
              markSegmentAsReadyToTakeOver({ variables }).catch(() => {});
            }}
          >
            {() => (
              <FormikForm>
                <h3 className="h3 tw-mb-4">Préparer un transfert multimodal</h3>

                <p>
                  Cette action aura pour effet de finaliser le segment suivant,
                  c'est à dire que vous ne pourrez plus le modifier. Cette
                  action est nécessaire pour transférer le déchet au
                  transporteur suivant.
                </p>
                {error && <NotificationError apolloError={error} />}

                <div className="form__actions">
                  <button
                    type="button"
                    className="btn btn--outline-primary"
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
      ) : null}
    </>
  );
}
