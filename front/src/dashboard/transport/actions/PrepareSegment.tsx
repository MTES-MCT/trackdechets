import { useMutation, gql } from "@apollo/client";
import { NotificationError } from "common/components/Error";
import { IconBusTransfer } from "common/components/Icons";

import React, { useState } from "react";

import { Field, Form as FormikForm, Formik } from "formik";

import CompanySelector from "form/company/CompanySelector";
import { segmentFragment } from "common/fragments";
import { transportModeLabels } from "../../constants";
import cogoToast from "cogo-toast";

import DateInput from "form/custom-inputs/DateInput";
import { GET_FORM } from "../queries";
import {
  Form,
  Mutation,
  MutationPrepareSegmentArgs,
  TransportMode,
  TransportSegment,
} from "generated/graphql/types";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";

import styles from "./Segments.module.scss";

const PREPARE_SEGMENT = gql`
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

type Props = {
  form: Omit<Form, "emitter" | "recipient" | "wasteDetails">;
  userSiret: String;
  inCard?: boolean;
};
export default function PrepareSegment({
  form,
  userSiret,
  inCard = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const segments: TransportSegment[] = form.transportSegments || [];
  const notReadytoTakeOverSegments = segments.filter(
    segment => !segment.readyToTakeOver
  );
  const lastSegment = segments[segments.length - 1];
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
      validityLimit: new Date().toISOString(),
      numberPlate: "",
    },

    mode: "ROAD" as TransportMode,
  };

  // there is no segment or last segment was taken over by current user
  const hasTakenOverLastSegment =
    !segments.length ||
    (!!lastSegment.takenOverAt &&
      lastSegment.transporter?.company?.siret === userSiret);

  // form must be sent
  // user must be marked as current transporter
  // there is no not ReadytoTakeOver segment

  if (
    form.status !== "SENT" ||
    form.currentTransporterSiret !== userSiret ||
    !!notReadytoTakeOverSegments.length ||
    !hasTakenOverLastSegment
  ) {
    return null;
  }

  return (
    <>
      {inCard ? (
        <button
          className="btn btn--primary"
          onClick={() => setIsOpen(true)}
          title="Signer ce bordereau"
        >
          <IconBusTransfer size="32px" />
          <span className="tw-text-sm tw-ml-2">
            Préparer <br />
            le&nbsp;transfert
          </span>
        </button>
      ) : (
        <ActionButton
          title="Préparer le transfert"
          icon={IconBusTransfer}
          onClick={() => setIsOpen(true)}
          iconSize="32px"
        />
      )}

      {isOpen ? (
        <TdModal
          isOpen={isOpen}
          ariaLabel="Préparer un segment multimodal"
          onClose={() => setIsOpen(false)}
          wide={true}
        >
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
                      customInfo: null,
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
                <h3 className={styles.title}>
                  Préparer un transfert multimodal
                </h3>
                <h4 className="form__section-heading">Transporteur</h4>
                <label htmlFor="id_mode">Mode de transport</label>
                <Field
                  as="select"
                  name="mode"
                  id="id_mode"
                  className="td-select"
                >
                  {Object.entries(transportModeLabels).map(([k, v]) => (
                    <option value={`${k}`} key={k}>
                      {v}
                    </option>
                  ))}
                </Field>
                <h4 className="form__section-heading">Siret</h4>
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
                <h4 className="form__section-heading">Autorisations</h4>

                <label htmlFor="isExemptedOfReceipt" className="tw-mb-2">
                  <Field
                    type="checkbox"
                    name="transporter.isExemptedOfReceipt"
                    id="isExemptedOfReceipt"
                    checked={values.transporter.isExemptedOfReceipt}
                  />
                  Le transporteur déclare être exempté de récépissé conformément
                  aux dispositions de l'article R.541-50 du code de
                  l'environnement.
                </label>
                {!values.transporter.isExemptedOfReceipt && (
                  <>
                    <label htmlFor="id_receipt">Numéro de récépissé</label>
                    <Field
                      type="text"
                      name="transporter.receipt"
                      id="id_receipt"
                      className="td-input"
                    />
                    <label htmlFor="id_department">Département</label>
                    <Field
                      type="text"
                      name="transporter.department"
                      id="id_department"
                      className="td-input"
                    />
                    <label htmlFor="id_validityLimit">Limite de validité</label>
                    <Field
                      name="transporter.validityLimit"
                      component={DateInput}
                      id="id_validityLimit"
                      className="td-input"
                    />
                    <label htmlFor="id_numberPlate">Immatriculation</label>
                    <Field
                      type="text"
                      name="transporter.numberPlate"
                      id="id_numberPlate"
                      className="td-input"
                    />
                  </>
                )}
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
