import { Form, Formik } from "formik";
import React, { useState, lazy } from "react";
import { IconPaperWrite } from "../../../../../Apps/common/Components/Icons/Icons";
import { useMutation } from "@apollo/client";
import { Mutation, MutationUpdateBsdasriArgs, Bsdasri } from "codegen-ui";
import TdModal from "../../../../../Apps/common/Components/Modal/Modal";
import { UPDATE_BSDASRI } from "../../../../../form/bsdasri/utils/queries";

import { NotificationError } from "../../../../../Apps/common/Components/Error/Error";
import Tooltip from "../../../../../common/components/Tooltip";
import { useRouteMatch } from "react-router-dom";
const TagsInput = lazy(
  () => import("../../../../../common/components/tags-input/TagsInput")
);

export function UpdateBsdasriTransporterPlates({
  bsdasri,
  isModalOpenFromParent,
  onModalCloseFromParent
}: {
  bsdasri: Bsdasri;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isV2Routes = !!useRouteMatch("/v2/dashboard/");

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
          title={"Modifier la ou les plaque(s) d'immatriculation"}
        >
          <IconPaperWrite color="blue" />
        </button>
      )}
      <UpdateTransporterPlatesModal
        bsdasri={bsdasri}
        isOpen={isOpened}
        onClose={handleClose}
      />
    </>
  );
}

function UpdateTransporterPlatesModal({
  bsdasri,
  isOpen,
  onClose
}: {
  bsdasri: Bsdasri;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [updateBsdasri, { error, loading }] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI, { onCompleted: onClose });

  return (
    <TdModal
      isOpen={isOpen}
      ariaLabel="Modifier la ou les plaque(s) d'immatriculation"
      onClose={onClose}
    >
      <h2 className="h2 tw-mb-4">Modifier</h2>
      <Formik
        initialValues={{ plates: bsdasri.transporter?.transport?.plates }}
        onSubmit={values => {
          return updateBsdasri({
            variables: {
              id: bsdasri.id,
              input: {
                transporter: { transport: { plates: values.plates ?? [] } }
              }
            }
          });
        }}
      >
        <Form>
          <label htmlFor="plates">
            Immatriculations
            <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
          </label>
          <TagsInput name="plates" limit={2} />

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
