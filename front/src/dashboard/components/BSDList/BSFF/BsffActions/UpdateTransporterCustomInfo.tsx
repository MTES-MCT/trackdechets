import React, { useState } from "react";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import { useMutation } from "@apollo/client";
import { Mutation, MutationUpdateBsffArgs } from "codegen-ui";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";
import { UPDATE_BSFF_FORM } from "../../../../../form/bsff/utils/queries";
import { Field, Form, Formik } from "formik";
import { BsffFragment } from "../types";
import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import { useMatch } from "react-router-dom";

export function UpdateTransporterCustomInfo({
  bsff,
  isModalOpenFromParent,
  onModalCloseFromParent
}: {
  bsff: BsffFragment;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isV2Routes = !!useMatch("/v2/dashboard/*");

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
          title={`Modifier le champ libre`}
        >
          <IconPaperWrite color="blue" />
        </button>
      )}
      <UpdateTransporterCustomInfoModal
        bsff={bsff}
        isOpen={isOpened}
        onClose={handleClose}
      />
    </>
  );
}

function UpdateTransporterCustomInfoModal({
  bsff,
  isOpen,
  onClose
}: {
  bsff: BsffFragment;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [updateBsff, { error, loading }] = useMutation<
    Pick<Mutation, "updateBsff">,
    MutationUpdateBsffArgs
  >(UPDATE_BSFF_FORM, { onCompleted: onClose });

  return (
    <TdModal
      isOpen={isOpen}
      ariaLabel="Modifier le champ libre"
      onClose={onClose}
    >
      <h2 className="h2 tw-mb-4">Modifier</h2>
      <Formik
        initialValues={{ customInfo: bsff.bsffTransporter?.customInfo }}
        onSubmit={values => {
          return updateBsff({
            variables: {
              id: bsff.id,
              input: { transporter: { customInfo: values.customInfo } }
            }
          });
        }}
      >
        <Form>
          <label htmlFor={"customInfo"}>Champ libre</label>
          <Field
            id="customInfo"
            name="customInfo"
            type="text"
            className="td-input"
          />
          {!!error && <NotificationError apolloError={error} />}

          <div className="form__actions">
            <button
              className="btn btn--outline-primary"
              type="button"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Envoi en cours" : "Modifier"}
            </button>
          </div>
        </Form>
      </Formik>
    </TdModal>
  );
}
