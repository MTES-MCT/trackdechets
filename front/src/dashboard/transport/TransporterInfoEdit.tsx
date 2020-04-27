import { useMutation } from "@apollo/react-hooks";
import { useFormik } from "formik";

import gql from "graphql-tag";

import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";

import { Form as FormModel } from "../../form/model";
import { NotificationError } from "../../common/Error";
import { capitalize } from "../../common/helper";
import "./TransportSignature.scss";

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

type Props = { form: FormModel; fieldName: string; title: string };

export default function TransporterInfoEdit({ form, fieldName, title }: Props) {
  const mutationFieldName = `transporter${capitalize(fieldName)}`;

  const [isOpen, setIsOpen] = useState(false);

  const [updateTransporterPlate, { error }] = useMutation(UPDATE_PLATE, {
    onCompleted: () => setIsOpen(false),
  });
  const formik = useFormik({
    initialValues: {
      [fieldName]: form.transporter[fieldName],
    },
    onSubmit: (values) => {
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
        className="link icon"
        onClick={() => setIsOpen(true)}
        title={title}
      >
        <FaEdit />
      </button>
      <div
        className="modal__backdrop"
        id="modal"
        style={{
          display: isOpen ? "flex" : "none",
        }}
      >
        <div className="modal">
          <h2>{title}</h2>
          <form onSubmit={formik.handleSubmit}>
            <label htmlFor={`id_${fieldName}`}>Nouvelle valeur</label>
            <input
              id={`id_${fieldName}`}
              name={fieldName}
              type="text"
              onChange={formik.handleChange}
              value={formik.values[fieldName]}
            />
            {error && <NotificationError apolloError={error} />}

            <div className="buttons">
              <button
                className="button warning"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </button>
              <button className="button" type="submit">
                Valider
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
