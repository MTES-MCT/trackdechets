import { useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import React, { useState, lazy } from "react";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";
import Tooltip from "../../../../../common/components/Tooltip";
import { UPDATE_BSDA } from "../../../../../Apps/common/queries/bsda/queries";
import { Bsda, Mutation, MutationUpdateBsdaArgs } from "@td/codegen-ui";
const TagsInput = lazy(
  () => import("../../../../../common/components/tags-input/TagsInput")
);
type Props = {
  bsda: Bsda;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function TransporterInfoEdit({
  bsda,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
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

  const isOpened = isOpen || isModalOpenFromParent!;

  const handleClose = () => {
    if (isModalOpenFromParent) {
      onModalCloseFromParent!();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {!isModalOpenFromParent && (
        <button
          className="link__ icon__ btn--no-style"
          onClick={() => setIsOpen(true)}
          title="Modifier les informations de transport"
        >
          <IconPaperWrite color="blue" />
        </button>
      )}
      <TdModal
        isOpen={isOpened}
        ariaLabel="Modifier les informations de transport"
        onClose={handleClose}
      >
        <h2 className="h2 tw-mb-4">Modifier</h2>
        <Formik
          initialValues={{
            transporter: {
              customInfo: bsda.transporter?.customInfo ?? "",
              transport: {
                plates: bsda?.transporter?.transport?.plates ?? []
              }
            }
          }}
          onSubmit={async values => {
            await updateBsda({
              variables: {
                id: bsda.id,
                input: values
              }
            });
            handleClose();
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
              <label htmlFor="transporter.transport.plates">
                Immatriculations
                <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
              </label>
              <TagsInput name="transporter.transport.plates" limit={2} />
            </div>

            <div className="form__actions">
              <button
                className="btn btn--outline-primary"
                type="button"
                onClick={handleClose}
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
