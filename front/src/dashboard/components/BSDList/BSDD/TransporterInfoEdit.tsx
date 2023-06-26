import { useMutation, gql } from "@apollo/client";
import { useFormik } from "formik";
import React, { useState } from "react";

import { Form as FormModel } from "generated/graphql/types";
import { isBsddTransporterFieldEditable } from "generated/constants/formHelpers";
import { NotificationError } from "Apps/common/Components/Error/Error";
import { capitalize } from "common/helper";
import { IconPaperWrite } from "common/components/Icons";
import TdModal from "common/components/Modal";

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
};

export default function TransporterInfoEdit({
  form,
  fieldName,
  verboseFieldName,
}: Props) {
  const mutationFieldName = `transporter${capitalize(fieldName)}`;

  const [isOpen, setIsOpen] = useState(false);

  const [updateTransporterPlate, { error }] = useMutation(UPDATE_PLATE, {
    onCompleted: () => setIsOpen(false),
  });

  const formik = useFormik({
    initialValues: {
      [fieldName]: form.stateSummary
        ? form.stateSummary[mutationFieldName]
        : null,
    },
    onSubmit: values => {
      return updateTransporterPlate({
        variables: { id: form.id, [mutationFieldName]: values[fieldName] },
      });
    },
  });

  if (!isBsddTransporterFieldEditable(form.status)) {
    return null;
  }
  return (
    <>
      <button
        className="link__ icon__ btn--no-style"
        onClick={() => setIsOpen(true)}
        title={`Modifier ${verboseFieldName}`}
      >
        <IconPaperWrite color="blue" />
      </button>
      <TdModal
        isOpen={isOpen}
        ariaLabel={`Modifier ${verboseFieldName}`}
        onClose={() => setIsOpen(false)}
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
              onClick={() => setIsOpen(false)}
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
