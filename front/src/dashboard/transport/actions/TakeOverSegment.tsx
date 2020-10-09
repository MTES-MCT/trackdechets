import "./TransportSignature.module.scss";

import { Field, Form as FormikForm, Formik } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React, { useState } from "react";
import {
  Form,
  Mutation,
  MutationTakeOverSegmentArgs,
  TransportSegment,
  FormRole,
  FormStatus,
} from "generated/graphql/types";
import { useMutation } from "@apollo/react-hooks";
import { NotificationError } from "common/components/Error";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "../queries";
import { updateApolloCache } from "common/helper";
import DateInput from "form/custom-inputs/DateInput";
import cogoToast from "cogo-toast";
import { BusTransfer } from "common/components/Icons";

export const TAKE_OVER_SEGMENT = gql`
  mutation takeOverSegment($id: ID!, $takeOverInfo: TakeOverInput!) {
    takeOverSegment(id: $id, takeOverInfo: $takeOverInfo) {
      id
    }
  }
`;

const getSegmentToTakeOver = ({ form, userSiret }) => {
  const transportSegments: TransportSegment[] = form?.transportSegments || [];

  if (!transportSegments.length) {
    return null;
  }
  // get readytoTakeOver and not yet taken over segments
  const readytoTakeOverSegments = transportSegments.filter(
    f => f.readyToTakeOver && !f.takenOverAt
  );
  if (!readytoTakeOverSegments.length) {
    return null;
  }
  // is the first readytoTakeOver segment is for current user, return it
  return readytoTakeOverSegments[0].transporter?.company?.siret === userSiret
    ? readytoTakeOverSegments[0]
    : null;
};

type Props = {
  form: Omit<Form, "emitter" | "recipient" | "wasteDetails">;
  userSiret: string;
};

export default function TakeOverSegment({ form, userSiret }: Props) {
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
  const segment = getSegmentToTakeOver({ form, userSiret });

  const initialValues = {
    takenOverBy: "",
    takenOverAt: DateTime.local().toISODate(),
  };

  if (!segment) {
    return null;
  }

  return (
    <>
      <button
        className="btn btn--primary btn--medium-text"
        onClick={() => setIsOpen(true)}
        title="Prendre en charge le déchet"
      >
        <BusTransfer />
        <span>
          Prendre&nbsp;en&nbsp;charge<br />le&nbsp;déchet
        </span>
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
                  <h2>Prendre en charge le déchet</h2>
                  <label>
                    Nom du responsable
                    <Field
                      type="text"
                      name="takenOverBy"
                      placeholder="NOM Prénom"
                    />
                  </label>
                  <label>
                    Date de prise en charge
                    <Field component={DateInput} name="takenOverAt" />
                  </label>
                  {error && <NotificationError apolloError={error} />}

                  <div className="buttons">
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
          </div>
        </div>
      ) : null}
    </>
  );
}
