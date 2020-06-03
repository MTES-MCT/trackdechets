import { useMutation } from "@apollo/react-hooks";

import gql from "graphql-tag";

import React, { useState } from "react";

import { Field, Form as FormikForm, Formik } from "formik";
import { transporterFormFragment } from "../../common/fragments";
import "./TransportSignature.scss";
import { transportModeLabels } from "../constants";
import CompanySelector from "../../form/company/CompanySelector";
import DateInput from "../../form/custom-inputs/DateInput";
import cogoToast from "cogo-toast";
import {
 
  Mutation,
  MutationEditSegmentArgs,
} from "../../generated/graphql/types";
import { NotificationError } from "../../common/Error";

/**Remove company data if segment is sealed */
const removeCompanyData = (values) => {
  if (!values.sealed) {
    return values;
  }
  const { transporter, ...rst } = values;
  const { company, ...trs } = transporter;
  return { ...rst, transporter: { ...trs } };
};

export const EDIT_SEGMENT = gql`
  mutation editSegment(
    $id: ID!
    $siret: String!
    $transporter: NextSegmentTransporterInput!
    $mode: TransportMode!
  ) {
    editSegment(
      id: $id
      siret: $siret
      nextSegmentInfo: { transporter: $transporter, mode: $mode }
    ) {
      ...TransporterForm
    }
  }
  ${transporterFormFragment}
`;

// Select a segement to edit, can be either :
// - for the current transporter who prepared a segement and need to edit it before sealing it
// - for the next transporter who need to edit a segemnt before taking over it

const getSegmentToEdit = ({ form, userSiret }) => {
  if (form.status !== "SENT") {
    return null;
  }
  const transportSegments = form.transportSegments || [];
  if (!transportSegments.length) {
    return null;
  }
  // unsealed form editable by current transporter before sealing
  if (form.currentTransporterSiret === userSiret) {
    // get unsealed  segments
    const sealableSegments = transportSegments.filter((f) => !f.sealed);
    if (!sealableSegments.length) {
      return null;
    }

    // is the first unsealed segment is for current user, return it
    return sealableSegments[0].previousTransporterCompanySiret === userSiret
      ? sealableSegments[0]
      : null;
  }
  // sealed form editable  by next transporter before take over
  if (form.nextTransporterSiret === userSiret) {
    // get sealed  segments
    const sealedSegments = transportSegments.filter((f) => f.sealed);
    if (!sealedSegments.length) {
      return null;
    }

    // is the first unsealed segment is for current user, return it
    return sealedSegments[0].transporter.company.siret === userSiret
      ? sealedSegments[0]
      : null;
  }
  return null;
};

type Props = { form: any; userSiret: string };

export default function EditSegment({ form, userSiret }: Props) {
  const [isOpen, setIsOpen] = useState(false);
 

  const [editSegment, { error }] = useMutation<
    Pick<Mutation, "editSegment">,
    MutationEditSegmentArgs
  >(EDIT_SEGMENT, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("Le segment de transport a été modifié", { hideAfter: 5 });
    },
  });

  const segment = getSegmentToEdit({ form, userSiret });

  if (!segment) {
    return null;
  }

  const initialValues = {
    ...segment,
  };

  return (
    <>
      <button
        className="button button-small"
        onClick={() => setIsOpen(true)}
        title="Modifier le segment"
      >
        Modifier le segment N°{segment.segmentNumber}
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
              onSubmit={(values ) => {
                const variables = {
                  ...removeCompanyData(values),
                  id: segment.id,
                  siret: userSiret,
                };

                editSegment({ variables }).catch(() => {});
              }}
            >
              {({ values }) => (
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

                  {!segment.sealed ? (
                    <>
                      <label>Siret</label>{" "}
                      <CompanySelector name="transporter.company" />{" "}
                    </>
                  ) : null}

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
                      <Field
                        type="text"
                        name="transporter.department"
                        id="department"
                      />
                      <label htmlFor="validityLimit">Limite de validité</label>
                      <Field
                        component={DateInput}
                        name="transporter.validityLimit"
                        id="validityLimit"
                      />
                      <label htmlFor="numberPlate">Immatriculation</label>
                      <Field
                        type="text"
                        name="transporter.numberPlate"
                        id="numberPlate"
                      />
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
