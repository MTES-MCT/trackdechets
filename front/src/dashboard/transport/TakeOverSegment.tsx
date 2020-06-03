import "./TransportSignature.scss";

import { Field, Form as FormikForm, Formik } from "formik";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import React, { useState } from "react";
import {
  Mutation,
  MutationTakeOverSegmentArgs,
} from "../../generated/graphql/types";
import { useMutation } from "@apollo/react-hooks";
import { NotificationError } from "../../common/Error";

import DateInput from "../../form/custom-inputs/DateInput";
import cogoToast from "cogo-toast";

export const TAKE_OVER_SEGMENT = gql`
  mutation takeOverSegment($id: ID!, $takeOverInfo: TakeOverInput!) {
    takeOverSegment(id: $id, takeOverInfo: $takeOverInfo) {
      id
    }
  }
`;

const getSegmentToTakeOver = ({ form, userSiret }) => {
  const transportSegments = form?.transportSegments || [];

  if (!transportSegments.length) {
    return null;
  }
  // get sealed and not yet taken over segments
  const sealedSegments = transportSegments.filter(
    (f) => f.sealed && !f.takenOverAt
  );

  if (!sealedSegments.length) {
    return null;
  }
  // is the first sealed segment is for current user, return it
  return sealedSegments[0].transporter.company.siret === userSiret
    ? sealedSegments[0]
    : null;
};

type Props = { form: any; userSiret: string; refetchQuery: any };

export default function TakeOverSegment({
  form,
  userSiret,
  refetchQuery,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

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
        className="button button-small"
        onClick={() => setIsOpen(true)}
        title="Prendre en charge le déchet"
      >
        Prendre en charge le déchet
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
              onSubmit={(values) => {
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
