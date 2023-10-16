import React, { useContext, useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import {
  Mutation,
  MutationMarkSegmentAsReadyToTakeOverArgs,
} from "generated/graphql/types";
import { segmentFragment } from "Apps/common/queries/fragments";
import TdModal from "Apps/common/Components/Modal/Modal";
import ActionButton from "common/components/ActionButton";
import { IconPaperWrite } from "Apps/common/Components/Icons/Icons";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { WorkflowActionProps } from "../WorkflowAction";
import { GET_BSDS } from "Apps/common/queries";
import { Loader } from "Apps/common/Components";
import { useRouteMatch } from "react-router-dom";
import { ValidationBsdContext } from "Pages/Dashboard";

const MARK_SEGMENT_AS_READY_TO_TAKE_OVER = gql`
  mutation markSegmentAsReadyToTakeOver($id: ID!) {
    markSegmentAsReadyToTakeOver(id: $id) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

export function MarkSegmentAsReadyToTakeOver({
  form,
  siret,
}: WorkflowActionProps) {
  const { setHasValidationApiError } = useContext(ValidationBsdContext);
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const [isOpen, setIsOpen] = useState(false);
  const [markSegmentAsReadyToTakeOver, { loading, error }] = useMutation<
    Pick<Mutation, "markSegmentAsReadyToTakeOver">,
    MutationMarkSegmentAsReadyToTakeOverArgs
  >(MARK_SEGMENT_AS_READY_TO_TAKE_OVER, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success(
        "Le bordereau est prêt à être pris en charge par le transporteur suivant",
        { hideAfter: 5 }
      );
    },
    onError: () => {
      if (isV2Routes) {
        setHasValidationApiError(true);
      }
    },
  });

  const segments = form.transportSegments!;
  // it's not possible to create a new segment if the last one
  // was not taken over. so the segment to take over is always the last
  const segment = segments[segments.length - 1];

  return (
    <>
      <ActionButton
        icon={<IconPaperWrite size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Finaliser pour transférer
      </ActionButton>
      {isOpen && (
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
          {loading && <Loader />}
        </TdModal>
      )}
    </>
  );
}
