import React, { useState } from "react";
import { IconPaperWrite } from "common/components/Icons";
import { useMutation } from "@apollo/client";
import { Mutation, MutationUpdateBsffArgs } from "generated/graphql/types";
import TdModal from "common/components/Modal";
import { UPDATE_BSFF_FORM } from "form/bsff/utils/queries";
import { Field, Form, Formik } from "formik";
import { BsffFragment } from "../types";
import { NotificationError } from "Apps/common/Components/Error/Error";

export function UpdateTransporterCustomInfo({ bsff }: { bsff: BsffFragment }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="link__ icon__ btn--no-style"
        onClick={() => setIsOpen(true)}
        title={`Modifier le champ libre`}
      >
        <IconPaperWrite color="blue" />
      </button>
      <UpdateTransporterCustomInfoModal
        bsff={bsff}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function UpdateTransporterCustomInfoModal({
  bsff,
  isOpen,
  onClose,
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
              input: { transporter: { customInfo: values.customInfo } },
            },
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
