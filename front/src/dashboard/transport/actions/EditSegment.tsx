import { useMutation } from "@apollo/react-hooks";

import gql from "graphql-tag";

import React, { useState } from "react";

import { Field, Form as FormikForm, Formik } from "formik";
import { segmentFragment } from "common/fragments";
import { PaperWriteIcon } from "common/components/Icons";

import { transportModeLabels } from "../../constants";
import CompanySelector from "form/company/CompanySelector";
import DateInput from "form/custom-inputs/DateInput";
import cogoToast from "cogo-toast";
import { GET_TRANSPORT_SLIPS, GET_FORM } from "../queries";
import {
  Form,
  Mutation,
  MutationEditSegmentArgs,
  TransportSegment,
  FormRole,
  FormStatus,
} from "generated/graphql/types";
import { NotificationError } from "common/components/Error";
import { updateApolloCache } from "common/helper";
import TdModal from "common/components/Modal";
import styles from "./Segments.module.scss";

/**Remove company data if segment is readytoTakeOver */
const removeCompanyData = values => {
  if (!values.readyToTakeOverXX) {
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
      ...Segment
    }
  }
  ${segmentFragment}
`;

// Select a segment to edit, can be either :
// - for the current transporter who prepared a segement and need to edit it before sealing it
// - for the next transporter who need to edit a segemnt before taking over it

const getSegmentToEdit = ({ form, userSiret }) => {
  if (form.status !== "SENT") {
    return null;
  }
  const transportSegments: TransportSegment[] = form.transportSegments || [];
  if (!transportSegments.length) {
    return null;
  }

  // not readytoTakeOver segment editable by current transporter before beeign marked as readyToTakeOver
  if (form.currentTransporterSiret === userSiret) {
    // get not readytoTakeOver segments
    const notReadytoTakeOverSegments = transportSegments.filter(
      f => !f.readyToTakeOver
    );

    if (!notReadytoTakeOverSegments.length) {
      return null;
    }

    // is the first not ReadytoTakeOver segment is for current user, return it
    return notReadytoTakeOverSegments[0].previousTransporterCompanySiret ===
      userSiret
      ? notReadytoTakeOverSegments[0]
      : null;
  }
  // readytoTakeOver form editable by next transporter before take over
  if (form.nextTransporterSiret === userSiret) {
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
  }
  return null;
};

type Props = {
  form: Omit<Form, "emitter" | "recipient" | "wasteDetails">;
  userSiret: string;
};

export default function EditSegment({ form, userSiret }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const refetchQuery = {
    query: GET_FORM,
    variables: { id: form.id },
  };
  const [editSegment, { error }] = useMutation<
    Pick<Mutation, "editSegment">,
    MutationEditSegmentArgs
  >(EDIT_SEGMENT, {
    onCompleted: () => {
      setIsOpen(false);
      cogoToast.success("Le segment de transport a été modifié", {
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
        className="btn btn--primary btn--medium-text"
        onClick={() => setIsOpen(true)}
        title="Modifier le segment"
      >
        <PaperWriteIcon />
        <span>
          Modifier <br />
          le&nbsp;segment&nbsp;N°{segment.segmentNumber}
        </span>
      </button>

      {isOpen ? (
        <TdModal
          isOpen={isOpen}
          ariaLabel="Modifier un segment multimodal"
          onClose={() => setIsOpen(false)}
          wide={true}
        >
          <Formik
            initialValues={initialValues}
            onSubmit={values => {
              const variables = {
                ...removeCompanyData(values),
                id: segment.id,
                siret: userSiret,
              };

              editSegment({ variables }).catch(() => {});
            }}
          >
            {({ values, setFieldValue }) => (
              <FormikForm>
                <h3 className={styles.title}>
                  Modifier un transfert multimodal
                </h3>
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
                <h4 className="form__section-heading">Transporteur</h4>

                {!segment.readyToTakeOver ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="form__row">
                      <label>
                        Personne à contacter
                        <Field
                          type="text"
                          name="transporter.company.contact"
                          placeholder="NOM Prénom"
                        />
                      </label>

                      <label>
                        Téléphone ou Fax
                        <Field
                          type="text"
                          name="transporter.company.phone"
                          placeholder="Numéro"
                        />
                      </label>

                      <label>
                        Mail
                        <Field type="email" name="transporter.company.mail" />
                      </label>
                    </div>
                  </>
                )}

                <h4 className="form__section-heading">Autorisations</h4>
                <label htmlFor="isExemptedOfReceipt" className="tw-mb-2">
                  <Field
                    type="checkbox"
                    name="transporter.isExemptedOfReceipt"
                    id="isExemptedOfReceipt"
                    checked={values?.transporter?.isExemptedOfReceipt}
                    className="td-input"
                  />
                  Le transporteur déclare être exempté de récépissé conformément
                  aux dispositions de l'article R.541-50 du code de
                  l'environnement.
                </label>
                {!values?.transporter?.isExemptedOfReceipt && (
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
                      component={DateInput}
                      name="transporter.validityLimit"
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
