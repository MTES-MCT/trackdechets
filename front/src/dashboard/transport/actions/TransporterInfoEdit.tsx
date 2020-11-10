import { useMutation, gql } from "@apollo/client";
import { useFormik } from "formik";
import React, { useState } from "react";

import { Form as FormModel } from "generated/graphql/types";
import { NotificationError } from "common/components/Error";
import { capitalize } from "common/helper";
import { PaperWriteIcon } from "common/components/Icons";
import TdModal from "common/components/Modal";

export const UPDATE_PLATE = gql`
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
    }
  }
`;

type Props = {
  form: FormModel;
  fieldName: string;
  verboseFieldName: string;

  refetchQuery: any;
};

export default function TransporterInfoEdit({
  form,
  fieldName,
  verboseFieldName,

  refetchQuery,
}: Props) {
  const mutationFieldName = `transporter${capitalize(fieldName)}`;

  const [isOpen, setIsOpen] = useState(false);

  const [updateTransporterPlate, { error }] = useMutation(UPDATE_PLATE, {
    onCompleted: () => setIsOpen(false),
    refetchQueries: [refetchQuery],
  });

  const formik = useFormik({
    initialValues: {
      [fieldName]: form.stateSummary
        ? form.stateSummary[mutationFieldName]
        : null,
    },
    onSubmit: values => {
      updateTransporterPlate({
        variables: { id: form.id, [mutationFieldName]: values[fieldName] },
      });
    },
  });

  if (form.status !== "SEALED") {
    return null;
  }
  return (
    <>
      <button
        className="link__ icon__ btn--no-style"
        onClick={() => setIsOpen(true)}
        title={`Modifier ${verboseFieldName}`}
      >
        <PaperWriteIcon color="#0053b3" />
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
            <button className="btn btn--primary" type="submit">
              Modifier
            </button>
          </div>
        </form>
      </TdModal>
    </>
  );
}
