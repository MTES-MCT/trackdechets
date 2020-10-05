import { useMutation } from "@apollo/react-hooks";
import { useFormik } from "formik";
import gql from "graphql-tag";
import React, { useState } from "react";
 
import { Form as FormModel } from "src/generated/graphql/types";
import { NotificationError } from "src/common/components/Error";
import { capitalize } from "src/common/helper";
import { PaperWriteIcon } from "src/common/components/Icons";
 

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
     
        <PaperWriteIcon color="#0053b3"/> 
      
      </button>
      {isOpen && (
        <div
          className="modal__backdrop"
          id="modal"
          style={{
            display: "flex",
          }}
        >
          <div className="modal">
            <h2>Modifier</h2>
            <form onSubmit={formik.handleSubmit}>
              <label htmlFor={`id_${fieldName}`}>
                {capitalize(verboseFieldName)}
              </label>
              <input
                id={`id_${fieldName}`}
                name={fieldName}
                type="text"
                onChange={formik.handleChange}
                value={formik.values[fieldName]}
              />
              {error && <NotificationError apolloError={error} />}

              <div className="form__actions">
                <button
                  className="button-outline primary"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Annuler
                </button>
                <button className="button no-margin" type="submit">
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
