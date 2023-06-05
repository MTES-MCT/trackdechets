import { useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import React, { useState, lazy } from "react";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { IconPaperWrite } from "common/components/Icons";
import TdModal from "common/components/Modal";
import Tooltip from "common/components/Tooltip";
import { UPDATE_BSDA } from "form/bsda/stepper/queries";
import {
  Bsda,
  Mutation,
  MutationUpdateBsdaArgs,
} from "generated/graphql/types";
const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));
type Props = {
  bsda: Bsda;
};

export function TransporterInfoEdit({ bsda }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [updateBsda, { error }] = useMutation<
    Pick<Mutation, "updateBsda">,
    MutationUpdateBsdaArgs
  >(UPDATE_BSDA);

  if (
    !["SIGNED_BY_PRODUCER", "SIGNED_BY_WORKER", "INITIAL"].includes(
      bsda["bsdaStatus"]
    )
  ) {
    return null;
  }

  return (
    <>
      <button
        className="link__ icon__ btn--no-style"
        onClick={() => setIsOpen(true)}
        title="Modifier les informations de transport"
      >
        <IconPaperWrite color="blue" />
      </button>
      <TdModal
        isOpen={isOpen}
        ariaLabel="Modifier les informations de transport"
        onClose={() => setIsOpen(false)}
      >
        <h2 className="h2 tw-mb-4">Modifier</h2>
        <Formik
          initialValues={{
            transporter: {
              customInfo: bsda.transporter?.customInfo ?? "",
              transport: {
                plates: bsda?.transporter?.transport?.plates ?? [],
              },
            },
          }}
          onSubmit={async values => {
            await updateBsda({
              variables: {
                id: bsda.id,
                input: values,
              },
            });
            setIsOpen(false);
          }}
        >
          <Form>
            <div className="form__row">
              <label>
                Champ libre
                <Field
                  type="text"
                  name="transporter.customInfo"
                  className="td-input"
                />
              </label>
            </div>

            <div className="form__row">
              <label>
                Immatriculations
                <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
                <TagsInput name="transporter.transport.plates" limit={2} />
              </label>
            </div>

            <div className="form__actions">
              <button
                className="btn btn--outline-primary"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </button>
              <button className="btn btn--primary" type="submit">
                Modifier
              </button>

              {error && <NotificationError apolloError={error} />}
            </div>
          </Form>
        </Formik>
      </TdModal>
    </>
  );
}
