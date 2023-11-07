import { useMutation } from "@apollo/client";
import { Field, Form, Formik } from "formik";
import React, { useState } from "react";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";

import { UPDATE_BSDASRI } from "../../../../../form/bsdasri/utils/queries";
import { Bsdasri, Mutation, MutationUpdateBsdasriArgs } from "codegen-ui";
import { useRouteMatch } from "react-router-dom";

type Props = {
  bsdasri: Bsdasri;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export function UpdateBsdasriTransporterInfo({
  bsdasri,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  console.log(bsdasri);
  const [isOpen, setIsOpen] = useState(false);
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const [updateBsdasri, { error }] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI);

  if (!["SIGNED_BY_PRODUCER", "INITIAL"].includes(bsdasri["bsdasriStatus"])) {
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
      {!isV2Routes && !isModalOpenFromParent && (
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
              customInfo: bsdasri.transporter?.customInfo ?? ""
            }
          }}
          onSubmit={async values => {
            await updateBsdasri({
              variables: {
                id: bsdasri.id,
                input: values
              }
            });
            handleClose();
          }}
        >
          <Form>
            <div className="form__row">
              <label>
                Champ libre transporteur
                <Field
                  component="textarea"
                  name="transporter.customInfo"
                  className="td-textarea"
                />
              </label>
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
