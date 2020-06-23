import { useMutation } from "@apollo/react-hooks";
import { DateTime } from "luxon";
import gql from "graphql-tag";
import React, { useState } from "react";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import { NotificationError } from "../../common/Error";
import DateInput from "../../form/custom-inputs/DateInput";
import {
  Form,
  Mutation,
  MutationPrepareSegmentArgs,
  TransportMode,
  TransportSegment,
} from "../../generated/graphql/types";
import { updateApolloCache } from "../../common/helper";
import CompanySelector from "../../form/company/CompanySelector";
import { segmentFragment } from "../../common/fragments";
import { transportModeLabels } from "../constants";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "./Transport";
import "./TransportSignature.scss";

export const PREPARE_SEGMENT = gql`
  mutation prepareSegment(
    $id: ID!
    $siret: String!
    $nextSegmentInfo: NextSegmentInfoInput!
  ) {
    prepareSegment(id: $id, siret: $siret, nextSegmentInfo: $nextSegmentInfo) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

interface Props {
  form: Form;
  userSiret: string;
}

export default function PrepareSegment({ form, userSiret }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const segments = form.transportSegments || [];
  // FIXME: TransportSegment has no property "sealed"
  const unsealedSegments = segments.filter((segment: any) => !segment.sealed);
  const lastSegment = segments[segments.length - 1] as TransportSegment | null;
  const refetchQuery = {
    query: GET_FORM,
    variables: { id: form.id },
  };
  const [prepareSegment, { error }] = useMutation<
    Pick<Mutation, "prepareSegment">,
    MutationPrepareSegmentArgs
  >(PREPARE_SEGMENT, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("Le segment a été créé", {
        hideAfter: 5,
      });
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
        getNewData: data => {
          return {
            forms: data.forms.filter(f => f.id === form.id),
          };
        },
      });
    },
  });

  const initialValues = {
    transporter: {
      company: {
        siret: "",
        name: "",
        address: "",
        contact: "",
        mail: "",
        phone: "",
      },
      isExemptedOfReceipt: false,
      receipt: "",
      department: "",
      validityLimit: DateTime.local().toISODate(),
      numberPlate: "",
    },

    mode: "ROAD" as TransportMode,
  };
  // form must be sent
  // user must be marked as current transporter
  // there is no unsealed segment
  const hasTakenOverLastSegment =
    !segments.length ||
    (!!lastSegment?.takenOverAt &&
      lastSegment?.transporter?.company?.siret !== userSiret);
  if (
    form.status !== "SENT" ||
    form.currentTransporterSiret !== userSiret ||
    !!unsealedSegments.length ||
    !hasTakenOverLastSegment
  ) {
    return null;
  }

  return (
    <>
      <button className="button button-small" onClick={() => setIsOpen(true)}>
        Préparer le transfert vers un autre transporteur
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
                const { transporter, ...rst } = values;
                const { validityLimit } = transporter;
                // prevent empty strings to be sent for validityLimit
                prepareSegment({
                  variables: {
                    id: form.id,
                    siret: userSiret as string,
                    nextSegmentInfo: {
                      transporter: {
                        ...transporter,
                        validityLimit: validityLimit || null,
                      },
                      ...rst,
                    },
                  },
                });
              }}
            >
              {({ values, setFieldValue }) => (
                <FormikForm>
                  <h2>Préparer un transfert multimodal</h2>
                  <h4>Transporteur</h4>
                  <label htmlFor="mode">Mode de transport</label>
                  <Field as="select" name="mode" id="id_mode">
                    {Object.entries(transportModeLabels).map(([k, v]) => (
                      <option value={`${k}`} key={k}>
                        {v}
                      </option>
                    ))}
                  </Field>
                  <label>Siret</label>
                  <CompanySelector
                    name="transporter.company"
                    onCompanySelected={transporter => {
                      if (transporter.transporterReceipt) {
                        setFieldValue(
                          "transporter.receipt",
                          transporter.transporterReceipt.receiptNumber
                        );
                        setFieldValue(
                          "transporter.validityLimit",
                          transporter.transporterReceipt.validityLimit
                        );
                        setFieldValue(
                          "transporter.department",
                          transporter.transporterReceipt.department
                        );
                      } else {
                        setFieldValue("transporter.receipt", "");
                        setFieldValue("transporter.validityLimit", null);
                        setFieldValue("transporter.department", "");
                      }
                    }}
                  />
                  <h4>Autorisations</h4>
                  <label htmlFor="isExemptedOfReceipt">
                    Le transporteur déclare être exempté de récépissé
                    conformément aux dispositions de l'article R.541-50 du code
                    de l'environnement.
                  </label>
                  <Field
                    type="checkbox"
                    name="transporter.isExemptedOfReceipt"
                    id="isExemptedOfReceipt"
                    checked={values.transporter.isExemptedOfReceipt}
                  />
                  {!values.transporter.isExemptedOfReceipt && (
                    <>
                      <label htmlFor="receipt">Numéro de récépissé</label>
                      <Field
                        type="text"
                        name="transporter.receipt"
                        id="receipt"
                      />
                      <label htmlFor="department">Département</label>
                      <Field type="text" name="transporter.department" />
                      <label htmlFor="validityLimit">Limite de validité</label>
                      <Field
                        name="transporter.validityLimit"
                        component={DateInput}
                      />
                      <label htmlFor="numberPlate">Immatriculation</label>
                      <Field type="text" name="transporter.numberPlate" />
                    </>
                  )}
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
