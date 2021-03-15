import { useMutation } from "@apollo/client";
import { RedErrorMessage } from "common/components";
import Tooltip from "common/components/Tooltip";
import { textConfig } from "dashboard/components/BSDList/WorkflowAction/ReceivedInfo";
import NumberInput from "form/common/components/custom-inputs/NumberInput";
import {
  InlineRadioButton,
  RadioButton,
} from "form/common/components/custom-inputs/RadioButton";
import { Field, Form, Formik } from "formik";
import {
  Mutation,
  MutationUpdateBsvhuArgs,
  Bsvhu,
  BsvhuRecipientType,
  WasteAcceptationStatusInput,
} from "generated/graphql/types";
import React from "react";
import { UPDATE_VHU_FORM } from "form/bsvhu/utils/queries";
import TagsInput from "form/bsvhu/components/tags-input/TagsInput";

type Props = {
  form: Bsvhu;
};

export default function RecipientForm({ form }: Props) {
  const [update] = useMutation<
    Pick<Mutation, "updateBsvhu">,
    MutationUpdateBsvhuArgs
  >(UPDATE_VHU_FORM);

  return (
    <Formik
      initialValues={{
        recipient: {
          operation: {
            done: form.recipient?.operation?.planned,
          },
          acceptance: {
            quantity: form.quantity?.tons,
            status: WasteAcceptationStatusInput.Accepted,
            refusalReason: "",
            ...(form.recipient?.type === BsvhuRecipientType.Demolisseur && {
              identification: {
                numbers: [],
                type: "NUMERO_ORDRE_REGISTRE_POLICE",
              },
            }),
          },
        },
      }}
      onSubmit={async values => {
        try {
          update({
            variables: {
              id: form.id,
              input: values as any,
            },
          });
        } catch (err) {}
      }}
    >
      {({ values, setFieldValue }) => {
        return (
          <Form>
            <div className="form__row">
              <label>
                Opération d’élimination / valorisation réalisée (code D/R)
              </label>
              <Field
                as="select"
                name="recipient.operation.done"
                className="td-select"
              >
                <option value="R 4">
                  R 4 - Recyclage ou récupération des métaux et des composés
                  métalliques
                </option>
                <option value="R 12">
                  R 12 - Échange de déchets en vue de les soumettre à l'une des
                  opérations numérotées R1 à R11
                </option>
              </Field>
            </div>

            <div className="form__row">
              <label>
                Quantité reçue (en tonnes)
                <Field
                  component={NumberInput}
                  name="recipient.acceptance.quantity"
                  className="td-input waste-details__quantity"
                  placeholder="2"
                  min="0"
                  step="1"
                />
              </label>

              <RedErrorMessage name="quantity.tons" />
            </div>

            <div className="form__row">
              <fieldset className="form__radio-group">
                <h4 className="tw-mr-2">Lot accepté: </h4>
                <Field
                  name="recipient.acceptance.status"
                  id={WasteAcceptationStatusInput.Accepted}
                  label="Oui"
                  component={InlineRadioButton}
                  onChange={() => {
                    // clear wasteRefusalReason if waste is accepted
                    setFieldValue("recipient.acceptance.refusalReason", "");
                    setFieldValue(
                      "recipient.acceptance.status",
                      WasteAcceptationStatusInput.Accepted
                    );
                  }}
                />
                <Field
                  name="recipient.acceptance.status"
                  id={WasteAcceptationStatusInput.Refused}
                  label="Non"
                  component={InlineRadioButton}
                  onChange={() => {
                    setFieldValue("recipient.acceptance.quantity", 0);
                    setFieldValue(
                      "recipient.acceptance.status",
                      WasteAcceptationStatusInput.Refused
                    );
                  }}
                />
                <Field
                  name="recipient.acceptance.status"
                  id={WasteAcceptationStatusInput.PartiallyRefused}
                  label="Partiellement"
                  component={InlineRadioButton}
                />
              </fieldset>

              {[
                WasteAcceptationStatusInput.Refused.toString(),
                WasteAcceptationStatusInput.PartiallyRefused.toString(),
              ].includes(values.recipient.acceptance.status) && (
                <p className="form__row">
                  <label>
                    {
                      textConfig[values.recipient.acceptance.status as string]
                        .refusalReasonText
                    }
                    <Field
                      name="recipient.acceptance.refusalReason"
                      className="td-input"
                    />
                  </label>
                </p>
              )}
            </div>

            {form.recipient?.type === BsvhuRecipientType.Demolisseur && (
              <>
                <div className="form__row">
                  <fieldset>
                    <legend>Identification par N° d'ordre</legend>
                    <Field
                      name="recipient.acceptance.identification.type"
                      id="NUMERO_ORDRE_REGISTRE_POLICE"
                      label="tels qu'ils figurent dans le registre de police"
                      component={RadioButton}
                    />
                    <Field
                      name="recipient.acceptance.identification.type"
                      id="NUMERO_ORDRE_LOTS_SORTANTS"
                      label="des lots sortants"
                      component={RadioButton}
                    />
                  </fieldset>

                  <RedErrorMessage name="recipient.acceptance.identification.type" />
                </div>

                <div className="form__row">
                  <label>
                    Détail des identifications
                    <Tooltip msg="Saisissez les identifications une par une. Appuyez sur la touche <Entrée> pour valider chacune" />
                    <TagsInput
                      name="recipient.acceptance.identification.numbers"
                      onChange={val => console.log(val)}
                    />
                  </label>
                </div>
              </>
            )}

            <div className="form__actions">
              <button type="submit" className="btn btn--primary">
                Enregistrer
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
