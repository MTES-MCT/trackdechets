import { Form, Formik } from "formik";
import React, { useState, lazy } from "react";
import { IconPaperWrite } from "common/components/Icons";
import { useMutation } from "@apollo/client";
import { Mutation, MutationUpdateBsffArgs } from "generated/graphql/types";
import TdModal from "common/components/Modal";
import { UPDATE_BSFF_FORM } from "form/bsff/utils/queries";
import { BsffFragment } from "../types";
import { NotificationError } from "Apps/common/Components/Error/Error";
import Tooltip from "common/components/Tooltip";
import { useRouteMatch } from "react-router-dom";
const TagsInput = lazy(() => import("common/components/tags-input/TagsInput"));

export function UpdateTransporterPlates({
  bsff,
  isModalOpenFromParent,
  onModalCloseFromParent,
}: {
  bsff: BsffFragment;
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
        bsff={bsff}
        isOpen={isOpened}
        onClose={handleClose}
      />
    </>
  );
}

function UpdateTransporterPlatesModal({
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
      ariaLabel="Modifier la ou les plaque(s) d'immatriculation"
      onClose={onClose}
    >
      <h2 className="h2 tw-mb-4">Modifier</h2>
      <Formik
        initialValues={{ plates: bsff.bsffTransporter?.transport?.plates }}
        onSubmit={values => {
          return updateBsff({
            variables: {
              id: bsff.id,
              input: {
                transporter: { transport: { plates: values.plates ?? [] } },
              },
            },
          });
        }}
      >
        <Form>
          <label>
            Immatriculations
            <Tooltip msg="Saisissez les numéros un par un. Appuyez sur la touche <Entrée> ou <Tab> pour valider chacun" />
            <TagsInput name="plates" limit={2} />
          </label>

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
