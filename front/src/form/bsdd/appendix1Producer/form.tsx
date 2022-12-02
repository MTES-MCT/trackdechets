import { useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import CompanySelector from "form/common/components/company/CompanySelector";
import { Field, Form, Formik } from "formik";
import {
  EmitterType,
  Form as Bsdd,
  InitialFormFraction,
  Mutation,
  MutationCreateFormArgs,
  MutationUpdateFormArgs,
} from "generated/graphql/types";
import React from "react";
import { getInitialCompany } from "../utils/initial-state";
import { CREATE_FORM, UPDATE_FORM } from "../utils/queries";

export function Appendix1ProducerForm({
  container,
  close,
}: {
  container: Bsdd;
  close: () => void;
}) {
  const [createForm] =
    useMutation<Pick<Mutation, "createForm">, MutationCreateFormArgs>(
      CREATE_FORM
    );

  const [updateForm] =
    useMutation<Pick<Mutation, "updateForm">, MutationUpdateFormArgs>(
      UPDATE_FORM
    );

  const currentGrouping =
    container.grouping?.map(g => ({
      form: { id: g.form.id },
    })) ?? [];

  return (
    <div className="tw-p-4">
      <h2 className="tw-text-2xl tw-font-bold">
        Création d'un bordereau d'annexe 1 pour le bordereau de tournée{" "}
        {container.readableId}
      </h2>
      <Formik
        initialValues={{
          emitter: {
            type: EmitterType.Appendix1Producer,
            isPrivateIndividual: false,
            company: getInitialCompany(),
          },
        }}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const { data } = await createForm({
              variables: { createFormInput: values },
            });
            if (!data?.createForm) {
              throw new Error("Erreur lors de la création");
            }

            await updateForm({
              variables: {
                updateFormInput: {
                  id: container.id,
                  grouping: [
                    ...currentGrouping,
                    { form: { id: data.createForm?.id } },
                  ],
                },
              },
            });
            close();
          } catch (err: any) {
            cogoToast.error(err.message, { hideAfter: 10 });
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => (
          <Form>
            <h4 className="form__section-heading">Entreprise émettrice</h4>
            <div className="form__row">
              <label>
                <Field
                  type="checkbox"
                  name="emitter.isPrivateIndividual"
                  className="td-checkbox"
                />
                L'émetteur est un particulier
              </label>
            </div>
            {values.emitter?.isPrivateIndividual ? (
              <div className="form__row">
                <div className="form__row">
                  <label>
                    Nom et prénom
                    <Field
                      type="text"
                      name="emitter.company.name"
                      className="td-input"
                    />
                  </label>
                </div>
                <div className="form__row">
                  <label>
                    Adresse
                    <Field
                      type="text"
                      name="emitter.company.address"
                      className="td-input"
                    />
                  </label>
                </div>
                <div className="form__row">
                  <label>
                    Téléphone (optionnel)
                    <Field
                      type="text"
                      name="emitter.company.phone"
                      className="td-input td-input--small"
                    />
                  </label>
                </div>
                <div className="form__row">
                  <label>
                    Mail (optionnel)
                    <Field
                      type="text"
                      name="emitter.company.mail"
                      className="td-input td-input--medium"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <CompanySelector name="emitter.company" />
            )}

            <div className="tw-pb-2 tw-flex tw-justify-end">
              <button
                type="button"
                className="btn btn--outline-primary"
                disabled={isSubmitting}
                onClick={close}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn--primary tw-ml-4"
                disabled={isSubmitting}
              >
                Créer
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
