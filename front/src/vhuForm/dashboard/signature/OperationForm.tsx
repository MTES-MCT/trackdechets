import { useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import {
  BordereauVhuMutation,
  BordereauVhuMutationUpdateArgs,
  VhuForm,
} from "generated/graphql/types";
import React from "react";
import { UPDATE_VHU_FORM } from "vhuForm/queries";

type Props = {
  form: VhuForm;
};

export default function TransporterForm({ form }: Props) {
  const [update] = useMutation<
    Pick<BordereauVhuMutation, "update">,
    BordereauVhuMutationUpdateArgs
  >(UPDATE_VHU_FORM);

  return (
    <Formik
      initialValues={{
        recipient: {
          operation: {
            done: form.recipient?.operation?.planned,
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
      <Form>
        <div className="form__row">
          <label>
            Opération d’élimination / valorisation prévue (code D/R)
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

        <div className="form__actions">
          <button type="submit" className="btn btn--primary">
            Enregistrer
          </button>
        </div>
      </Form>
    </Formik>
  );
}
