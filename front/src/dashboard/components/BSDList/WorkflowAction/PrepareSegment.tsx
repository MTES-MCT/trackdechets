import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import {
  Form,
  Mutation,
  MutationPrepareSegmentArgs,
  TransportMode,
  FormRole,
  FormStatus,
} from "generated/graphql/types";
import { segmentFragment } from "common/fragments";
import { updateApolloCache } from "common/helper";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";
import { NotificationError } from "common/components/Error";
import { IconBusTransfer } from "common/components/Icons";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { transportModeLabels } from "../../../constants";
import { GET_TRANSPORT_BSDS } from "../../../transport/queries";
import { WorkflowActionProps } from "./WorkflowAction";

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

export default function PrepareSegment({ form, siret }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        vatNumber: ""
      },
      isExemptedOfReceipt: false,
      receipt: "",
      department: "",
      validityLimit: new Date().toISOString(),
      numberPlate: "",
    },

    mode: "ROAD" as TransportMode,
  };

  return (
    <>
      <ActionButton
        icon={<IconBusTransfer size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Préparer le transfert
      </ActionButton>
      {isOpen && (
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
                  siret,
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
                <h3>Préparer un transfert multimodal</h3>
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
      )}
    </>
  );
}
