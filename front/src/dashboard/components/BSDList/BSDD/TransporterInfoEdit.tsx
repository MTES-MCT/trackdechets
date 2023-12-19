import { useMutation, gql } from "@apollo/client";
import { useFormik } from "formik";
import React, { useState } from "react";

import { Form as FormModel } from "@td/codegen-ui";
import { isBsddTransporterFieldEditable } from "shared/constants";
import { NotificationError } from "../../../../Apps/common/Components/Error/Error";
import { capitalize } from "../../../../common/helper";
import { IconPaperWrite } from "../../../../Apps/common/Components/Icons/Icons";
import TdModal from "../../../../Apps/common/Components/Modal/Modal";
import { useMatch } from "react-router-dom";

const UPDATE_PLATE = gql`
  mutation updateTransporterFields(
    $id: ID!
    $transporterNumberPlate: String
    $transporterCustomInfo: String
  ) {
    updateTransporterFields(
      id: $id
      transporterNumberPlate: $transporterNumberPlate
      transporterCustomInfo: $transporterCustomInfo
    ) {
      id
      transporter {
        numberPlate
        customInfo
      }
      # query stateSummary to update the cache
      stateSummary {
        transporterCustomInfo
        transporterNumberPlate
      }
    }
  }
`;

type Props = {
  form: FormModel;
  fieldName: string;
  verboseFieldName: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
};

export default function TransporterInfoEdit({
  form,
  fieldName,
  verboseFieldName,
  isModalOpenFromParent,
  onModalCloseFromParent
}: Props) {
  const mutationFieldName = `transporter${capitalize(fieldName)}`;

  const [isOpen, setIsOpen] = useState(false);
  const isV2Routes = !!useMatch("/v2/dashboard/*");

  const [updateTransporterPlate, { error }] = useMutation(UPDATE_PLATE, {
    onCompleted: () => handleClose()
  });

  const formik = useFormik({
    initialValues: {
      [fieldName]: form.stateSummary
        ? form.stateSummary[mutationFieldName]
        : null
    },
    onSubmit: values => {
      return updateTransporterPlate({
        variables: { id: form.id, [mutationFieldName]: values[fieldName] }
      });
    }
  });

  if (!isBsddTransporterFieldEditable(form.status)) {
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
          title={`Modifier ${verboseFieldName}`}
        >
          <IconPaperWrite color="blue" />
        </button>
      )}
      <TdModal
        isOpen={isOpened}
        ariaLabel={`Modifier ${verboseFieldName}`}
        onClose={handleClose}
      >
        <h2 className="h2 tw-mb-4">Modifier</h2>
        <form onSubmit={formik.handleSubmit}>
          <label htmlFor={`id_${fieldName}`}>
            {capitalize(verboseFieldName)}
          </label>
          <input
            id={`id_${fieldName}`}
            name={fieldName}
            type="text"
            className="td-input"
            onChange={formik.handleChange}
            value={formik.values[fieldName]}
          />
          {!!error && <NotificationError apolloError={error} />}

          <div className="form__actions">
            <button
              className="btn btn--outline-primary"
              type="button"
              onClick={handleClose}
            >
              Annuler
            </button>
            <button
              className="btn btn--primary"
              type="submit"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Envoi en cours" : "Modifier"}
            </button>
          </div>
        </form>
      </TdModal>
    </>
  );
}
