import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import cogoToast from "cogo-toast";
import {
  Mutation,
  MutationEditSegmentArgs,
  NextSegmentInfoInput,
  TransportSegment,
} from "generated/graphql/types";
import { segmentFragment } from "common/fragments";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "common/components/Error";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";
import CompanySelector from "form/common/components/company/CompanySelector";
import DateInput from "form/common/components/custom-inputs/DateInput";
import { FieldTransportModeSelect } from "common/components";

const EDIT_SEGMENT = gql`
  mutation editSegment(
    $id: ID!
    $siret: String!
    $nextSegmentInfo: NextSegmentInfoInput!
  ) {
    editSegment(id: $id, siret: $siret, nextSegmentInfo: $nextSegmentInfo) {
      ...Segment
    }
  }
  ${segmentFragment}
`;

type Props = {
  siret: string;
  segment: TransportSegment;
};

export default function EditSegment({ siret, segment }: Props) {
  const [isOpen, setIsOpen] = useState(false);
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
  });
  const initialValues: NextSegmentInfoInput = {
    transporter: segment.transporter,
    mode: segment.mode!,
  };

  return (
    <>
      <ActionButton
        icon={<IconPaperWrite size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Modifier le segment
      </ActionButton>
      {isOpen && (
        <TdModal
          isOpen={isOpen}
          ariaLabel="Modifier un segment multimodal"
          onClose={() => setIsOpen(false)}
          wide={true}
        >
          <Formik
            initialValues={initialValues}
            onSubmit={values =>
              editSegment({
                variables: {
                  id: segment.id,
                  siret,
                  nextSegmentInfo: values,
                },
              })
            }
          >
            {({ values, setFieldValue }) => (
              <FormikForm>
                <h3>Modifier un transfert multimodal</h3>
                <label htmlFor="id_mode">Mode de transport</label>
                <Field
                  id="id_mode"
                  name="mode"
                  component={FieldTransportModeSelect}
                ></Field>
                <h4 className="form__section-heading">Transporteur</h4>

                {!segment.readyToTakeOver ? (
                  <>
                    <CompanySelector
                      name="transporter.company"
                      allowForeignCompanies={true}
                      registeredOnlyCompanies={true}
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
      )}
    </>
  );
}
