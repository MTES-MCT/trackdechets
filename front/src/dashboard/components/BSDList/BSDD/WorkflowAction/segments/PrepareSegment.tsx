import { useMutation, gql } from "@apollo/client";
import toast from "react-hot-toast";
import { Field, Form as FormikForm, Formik } from "formik";
import React, { useState } from "react";
import {
  Mutation,
  MutationPrepareSegmentArgs,
  NextSegmentInfoInput,
  TransportMode
} from "codegen-ui";
import { segmentFragment } from "../../../../../../Apps/common/queries/fragments";
import TdModal from "../../../../../../Apps/common/Components/Modal/Modal";
import ActionButton from "../../../../../../common/components/ActionButton";
import { NotificationError } from "../../../../../../Apps/common/Components/Error/Error";
import { IconBusTransfer } from "../../../../../../Apps/common/Components/Icons/Icons";
import CompanySelector from "../../../../../../form/common/components/company/CompanySelector";
import { WorkflowActionProps } from "../WorkflowAction";
import TdSwitch from "../../../../../../common/components/Switch";
import {
  GET_BSDS,
  GET_DETAIL_FORM
} from "../../../../../../Apps/common/queries";
import {
  FieldTransportModeSelect,
  RedErrorMessage
} from "../../../../../../common/components";
import { Loader } from "../../../../../../Apps/common/Components";
import {
  onCompanySelected,
  validationSchema
} from "../../../../../detail/bsdd/EditSegment";
import { isForeignVat } from "shared/constants";

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

export function PrepareSegment({ form, siret }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prepareSegment, { loading, error }] = useMutation<
    Pick<Mutation, "prepareSegment">,
    MutationPrepareSegmentArgs
  >(PREPARE_SEGMENT, {
    refetchQueries: [GET_BSDS, GET_DETAIL_FORM],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setIsOpen(false);
      toast.success("Le segment a été créé", {
        duration: 5
      });
    },
    onError: () => {
      // The error is handled in the UI
    }
  });

  const initialValues: NextSegmentInfoInput = {
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
      numberPlate: null
    },

    mode: "ROAD" as TransportMode
  };

  return (
    <>
      <ActionButton
        icon={<IconBusTransfer size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Préparer le transfert à un autre transporteur (multimodal)
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
            validationSchema={validationSchema}
            onSubmit={values => {
              const { transporter, ...rst } = values;
              const { validityLimit } = transporter!;
              // prevent empty strings to be sent for validityLimit
              prepareSegment({
                variables: {
                  id: form.id,
                  siret,
                  nextSegmentInfo: {
                    transporter: {
                      ...transporter,
                      customInfo: null,
                      validityLimit: validityLimit || null
                    },
                    ...rst
                  }
                }
              });
            }}
          >
            {({ values, setFieldValue }) => (
              <FormikForm>
                <h3 className="h3">Préparer un transfert multimodal</h3>
                <div className="notification success tw-mt-3">
                  À compléter uniquement en cas de transport multimodal. En cas
                  de transport simple, vous n'avez rien à faire, c'est à
                  l'installation de destination ou d'entreposage provisoire de
                  valider la réception.
                </div>
                <h4 className="form__section-heading">Transporteur</h4>
                <div className="form__row">
                  <label htmlFor="id_mode">Mode de transport</label>
                  <Field
                    id="id_mode"
                    name="mode"
                    component={FieldTransportModeSelect}
                  ></Field>
                  <label htmlFor="id_numberPlate">Immatriculation</label>
                  <Field
                    type="text"
                    name="transporter.numberPlate"
                    id="id_numberPlate"
                    className="td-input"
                  />
                  <RedErrorMessage name="transporter.numberPlate" />
                </div>
                <h4 className="form__section-heading">
                  Siret ou numéro de TVA pour les transporteurs étrangers
                </h4>
                <CompanySelector
                  name="transporter.company"
                  allowForeignCompanies={true}
                  registeredOnlyCompanies={true}
                  initialAutoSelectFirstCompany={false}
                  onCompanySelected={onCompanySelected(setFieldValue)}
                />
                {!isForeignVat(values.transporter?.company?.vatNumber!) && (
                  <>
                    <h4 className="form__section-heading">
                      Exemption de récépissé de déclaration de transport de
                      déchets
                    </h4>

                    <div className="form__row">
                      <TdSwitch
                        checked={!!values.transporter?.isExemptedOfReceipt}
                        onChange={checked =>
                          setFieldValue(
                            "transporter.isExemptedOfReceipt",
                            checked
                          )
                        }
                        label="Le transporteur déclare être exempté de récépissé conformément
                      aux dispositions de l'article R.541-50 du code de
                      l'environnement."
                      />
                    </div>
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
          {loading && <Loader />}
        </TdModal>
      )}
    </>
  );
}
