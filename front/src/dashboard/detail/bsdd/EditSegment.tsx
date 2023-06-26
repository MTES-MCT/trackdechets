import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { Field, Form as FormikForm, Formik } from "formik";
import { string, object, date, boolean } from "yup";
import cogoToast from "cogo-toast";
import {
  CompanySearchPrivate,
  CompanySearchResult,
  Mutation,
  MutationEditSegmentArgs,
  NextSegmentInfoInput,
  TransportSegment,
} from "generated/graphql/types";
import { segmentFragment } from "Apps/common/queries/fragments";
import { IconPaperWrite } from "common/components/Icons";
import { NotificationError } from "Apps/common/Components/Error/Error";
import TdModal from "common/components/Modal";
import ActionButton from "common/components/ActionButton";
import TdSwitch from "common/components/Switch";
import CompanySelector from "form/common/components/company/CompanySelector";
import { FieldTransportModeSelect, RedErrorMessage } from "common/components";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import { transporterCompanySchema } from "common/validation/schema";

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

export const validationSchema = object().shape({
  transporter: object().shape({
    isExemptedOfReceipt: boolean().nullable(),
    receipt: string().when(["isExemptedOfReceipt", "company.vatNumber"], {
      is: (isExemptedOfReceipt: boolean, transporterCompanyVatNumber: string) =>
        isForeignVat(transporterCompanyVatNumber) || isExemptedOfReceipt,
      then: schema => schema.nullable(true),
      otherwise: schema =>
        schema
          .ensure()
          .required(
            "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
          ),
    }),
    department: string().when(["isExemptedOfReceipt", "company.vatNumber"], {
      is: (isExemptedOfReceipt: boolean, transporterCompanyVatNumber: string) =>
        isForeignVat(transporterCompanyVatNumber) || isExemptedOfReceipt,
      then: schema => schema.nullable(true),
      otherwise: schema =>
        schema
          .ensure()
          .required("Le département du transporteur est obligatoire"),
    }),
    validityLimit: date().nullable(true),
    numberPlate: string().nullable(true),
    company: transporterCompanySchema,
  }),
});

/**
 * Common onCompanySelected function
 * @param setFieldValue Formik function
 * @returns
 */
export const onCompanySelected =
  setFieldValue =>
  (transporter?: CompanySearchResult | CompanySearchPrivate) => {
    if (transporter?.transporterReceipt) {
      setFieldValue(
        "transporter.receipt",
        transporter?.transporterReceipt.receiptNumber
      );
      setFieldValue(
        "transporter.validityLimit",
        transporter?.transporterReceipt.validityLimit
      );
      setFieldValue(
        "transporter.department",
        transporter?.transporterReceipt.department
      );
    } else {
      setFieldValue("transporter.receipt", null);
      setFieldValue("transporter.validityLimit", null);
      setFieldValue("transporter.department", null);
    }
    // automatically check the receipt exemption
    if (isForeignVat(transporter?.vatNumber!)) {
      setFieldValue("transporter.isExemptedOfReceipt", true);
    }
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
            validationSchema={validationSchema}
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
            {({ values, errors, setFieldValue }) => (
              <FormikForm>
                <h3>Modifier un transfert multimodal</h3>
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
                <h4 className="form__section-heading">Transporteur</h4>
                {!segment.readyToTakeOver ? (
                  <>
                    <CompanySelector
                      name="transporter.company"
                      allowForeignCompanies={true}
                      registeredOnlyCompanies={true}
                      initialAutoSelectFirstCompany={false}
                      onCompanySelected={onCompanySelected(setFieldValue)}
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
                        <RedErrorMessage name="transporter.company.contact" />
                      </label>

                      <label>
                        Téléphone ou Fax
                        <Field
                          type="text"
                          name="transporter.company.phone"
                          placeholder="Numéro"
                        />
                        <RedErrorMessage name="transporter.company.phone" />
                      </label>

                      <label>
                        Mail
                        <Field type="email" name="transporter.company.mail" />
                      </label>
                      <RedErrorMessage name="transporter.company.mail" />
                    </div>
                  </>
                )}
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
        </TdModal>
      )}
    </>
  );
}
