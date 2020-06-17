import { useMutation } from "@apollo/react-hooks";

import gql from "graphql-tag";

import React, { useState } from "react";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "./Transport";
import {
  Form,
  Mutation,
  MutationMarkSegmentAsReadyToTakeOverArgs,
} from "../../generated/graphql/types";
import { Form as FormikForm, Formik } from "formik";
import { segmentFragment } from "../../common/fragments";
import "./TransportSignature.scss";
import { updateApolloCache } from "../../common/helper";
import cogoToast from "cogo-toast";
import { NotificationError } from "../../common/Error";

export const MARK_SEGMENT_AS_READY_TO_TAKE_OVER = gql`
  mutation markSegmentAsReadyToTakeOver($id: ID!) {
    markSegmentAsReadyToTakeOver(id: $id) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

const getSegmentToMarkSegmentAsReadyToTakeOver = ({ form, userSiret }) => {
  const transportSegments = form.transportSegments || [];
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

type Props = { form: any; userSiret: string };

export default function MarkSegmentAsReadyToTakeOver({
  form,
  userSiret,
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
          roles: ["TRANSPORTER"],
          status: ["SEALED", "SENT", "RESEALED", "RESENT"],
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
      <button
        className="button button-small"
        onClick={() => setIsOpen(true)}
        title="Marquer comme prêt à transférer"
      >
        Marquer comme prêt à transférer le segment N°{segment.segmentNumber}
      </button>

      {isOpen ? (
        <div
          className="modal__backdrop"
          id="modal"
          style={{
            display: isOpen ? "flex" : "none",
          }}
        >
          <div className="modal">
            <Formik
              initialValues={{}}
              onSubmit={(values, { setFieldError, setSubmitting }) => {
                const variables = {
                  id: segment.id,
                };
                markSegmentAsReadyToTakeOver({ variables }).catch(() => {});
              }}
            >
              {({ values }) => (
                <FormikForm>
                  <h2>Finaliser le segment</h2>
                  <p>
                    Cette action aura pour effet de finaliser le segment
                    suivant, c'est à dire que vous ne pourrez plus l'éditer.
                    Cette action est nécessaire pour transférer le déchet au
                    transporteur suivant.
                  </p>
                  {error && <NotificationError apolloError={error} />}

                  <div className="buttons">
                    <button
                      type="button"
                      className="button warning"
                      onClick={() => setIsOpen(false)}
                    >
                      Annuler
                    </button>
                    <button className="button" type="submit">
                      Valider
                    </button>
                  </div>
                </FormikForm>
              )}
            </Formik>
          </div>
        </div>
      ) : null}
    </>
  );
}
