import { Field, Form, Formik } from "formik";
import React, { useState } from "react";
import { mergeDefaults, updateApolloCache } from "common/helper";
import RedErrorMessage from "common/components/RedErrorMessage";
import CompanySelector from "form/company/CompanySelector";
import NumberInput from "form/custom-inputs/NumberInput";
import { RadioButton } from "form/custom-inputs/RadioButton";
import Packagings from "form/packagings/Packagings";
import {
  FormStatus,
  Mutation,
  Query,
  WasteDetails,
} from "generated/graphql/types";
import ProcessingOperationSelect from "common/components/ProcessingOperationSelect";
import { WorkflowActionProps } from "./WorkflowAction";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconPaperWrite } from "common/components/Icons";
import { gql, useMutation } from "@apollo/client";
import { statusChangeFragment } from "common/fragments";
import { ACT_TAB_FORMS, FOLLOW_TAB_FORMS } from "dashboard/bsds/queries";
import { NotificationError } from "common/components/Error";
import cogoToast from "cogo-toast";
import Transporter from "form/Transporter";

const MARK_RESEALED = gql`
  mutation MarkAsResealed($id: ID!, $resealedInfos: ResealedFormInput!) {
    markAsResealed(id: $id, resealedInfos: $resealedInfos) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

export default function MarkAsResealed({ form, siret }: WorkflowActionProps) {
  const initialValues = mergeDefaults(
    emptyState,
    form.temporaryStorageDetail || {}
  );
  const [isRefurbished, setIsRefurbished] = useState(
    !!form.temporaryStorageDetail?.wasteDetails?.quantity
  );

  function onChangeRefurbished(values, setFieldValue: (field, value) => void) {
    const willBeRefurbished = !isRefurbished;
    setIsRefurbished(willBeRefurbished);

    if (willBeRefurbished) {
      const { wasteDetails } = form;

      if (wasteDetails == null) {
        return;
      }

      const keys: Array<keyof WasteDetails> = [
        "onuCode",
        "packagingInfos",
        "quantity",
        "quantityType",
      ];
      keys.forEach(key => {
        switch (key) {
          case "packagingInfos": {
            if (
              wasteDetails[key]?.length &&
              values.wasteDetails[key].length === 0
            ) {
              setFieldValue(`wasteDetails.${key}`, wasteDetails[key]);
            }
            break;
          }
          default: {
            if (wasteDetails[key] && !values.wasteDetails[key]) {
              setFieldValue(`wasteDetails.${key}`, wasteDetails[key]);
            }
            break;
          }
        }
      });
    }
  }

  const [markAsResealed, { error }] = useMutation<
    Pick<Mutation, "markAsResealed">
  >(MARK_RESEALED, {
    update: (cache, { data }) => {
      if (!data?.markAsResealed) {
        return;
      }
      const resealedForm = data.markAsResealed;
      // remove form from the action tab
      updateApolloCache<Pick<Query, "forms">>(cache, {
        query: ACT_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [...data.forms].filter(form => form.id !== resealedForm.id),
        }),
      });
      // add the form to the follow tab
      updateApolloCache<Pick<Query, "forms">>(cache, {
        query: FOLLOW_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [resealedForm, ...data.forms],
        }),
      });
    },
    onCompleted: data => {
      if (
        data.markAsResealed &&
        data.markAsResealed.status === FormStatus.Resealed
      ) {
        cogoToast.success(
          `Les informations du BSD ont bien été complétées. Vous pouvez retrouver ce BSD dans l'onglet "Suivi"`
        );
      }
    },
  });

  const actionLabel = "Compléter le BSD suite";

  return (
    <TdModalTrigger
      ariaLabel={actionLabel}
      trigger={open => (
        <ActionButton icon={<IconPaperWrite size="24px" />} onClick={open}>
          {actionLabel}
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <Formik
            initialValues={initialValues}
            onSubmit={values =>
              markAsResealed({
                variables: { id: form.id, resealedInfos: values },
              })
            }
          >
            {({ values, setFieldValue }) => (
              <Form>
                <h5 className="form__section-heading">
                  Installation de destination prévue
                </h5>

                <CompanySelector name="destination.company" />

                <div className="form__row">
                  <label>
                    Numéro de CAP (le cas échéant)
                    <Field
                      type="text"
                      name="destination.cap"
                      className="td-input"
                    />
                  </label>
                </div>

                <div className="form__row">
                  <Field
                    component={ProcessingOperationSelect}
                    name="destination.processingOperation"
                  />
                </div>

                <div className="form__row form__row--inline">
                  <input
                    type="checkbox"
                    checked={isRefurbished}
                    id="id_isRefurbished"
                    className="td-checkbox"
                    onChange={() => onChangeRefurbished(values, setFieldValue)}
                  />
                  <label htmlFor="id_isRefurbished">
                    Les déchets ont subi un reconditionnement, je dois saisir
                    les détails
                  </label>
                </div>

                {isRefurbished && (
                  <>
                    <h5 className="form__section-heading">Détails du déchet</h5>

                    <h4>Conditionnement</h4>

                    <Field
                      name="wasteDetails.packagingInfos"
                      component={Packagings}
                    />

                    <h4>Quantité en tonnes</h4>
                    <div className="form__row">
                      <Field
                        component={NumberInput}
                        name="wasteDetails.quantity"
                        className="td-input"
                        placeholder="En tonnes"
                        min="0"
                        step="0.001"
                      />

                      <RedErrorMessage name="wasteDetails.quantity" />

                      <fieldset>
                        <legend>Cette quantité est</legend>
                        <Field
                          name="wasteDetails.quantityType"
                          id="REAL"
                          label="Réelle"
                          component={RadioButton}
                        />
                        <Field
                          name="wasteDetails.quantityType"
                          id="ESTIMATED"
                          label="Estimée"
                          component={RadioButton}
                        />
                      </fieldset>

                      <RedErrorMessage name="wasteDetails.quantityType" />
                    </div>
                    <div className="form__row">
                      <label>
                        Mentions au titre des règlements ADR, RID, ADNR, IMDG
                        (le cas échéant)
                        <Field
                          type="text"
                          name="wasteDetails.onuCode"
                          className="td-input"
                        />
                      </label>
                    </div>
                  </>
                )}

                <h5 className="form__section-heading">
                  Collecteur-transporteur après entreposage ou reconditionnement
                </h5>

                <Transporter />

                <div className="form__actions">
                  <button
                    type="button"
                    className="btn btn--outline-primary"
                    onClick={close}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Je valide
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          {error && (
            <NotificationError className="action-error" apolloError={error} />
          )}
        </div>
      )}
    />
  );
}

const emptyState = {
  destination: {
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
    },
    cap: "",
    processingOperation: "",
  },
  transporter: {
    isExemptedOfReceipt: false,
    receipt: "",
    department: "",
    validityLimit: null,
    numberPlate: "",
    company: {
      siret: "",
      name: "",
      address: "",
      contact: "",
      mail: "",
      phone: "",
    },
  },
  wasteDetails: {
    onuCode: "",
    packagings: [] as string[],
    packagingInfos: [],
    otherPackaging: "",
    numberOfPackages: null,
    quantity: null,
    quantityType: "ESTIMATED",
  },
};
