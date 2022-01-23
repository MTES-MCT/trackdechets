import { useMutation, gql } from "@apollo/client";
import { useFormik } from "formik";
import React, { useState } from "react";

import {
  CommonBsd,
  CommonBsdStatus,
  Mutation,
  MutationUpdateTransporterFieldsArgs,
} from "generated/graphql/types";
import { NotificationError } from "common/components/Error";
import { capitalize } from "common/helper";
import { IconPaperWrite } from "common/components/Icons";
import TdModal from "common/components/Modal";
import { GET_BSDS } from "common/queries";

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
    }
  }
`;

type Props = {
  bsd: CommonBsd;
  fieldName: string;
  verboseFieldName: string;
  initialValue: string;
};

export default function TransporterInfoEdit({
  bsd,
  fieldName,
  verboseFieldName,
  initialValue,
}: Props) {
  const mutationFieldName = `transporter${capitalize(fieldName)}`;

  const [isOpen, setIsOpen] = useState(false);

  const [updateTransporterPlate, { error }] = useMutation<
    Pick<Mutation, "updateTransporterFields">,
    MutationUpdateTransporterFieldsArgs
  >(UPDATE_PLATE, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: () => setIsOpen(false),
  });

  const formik = useFormik({
    initialValues: {
      [fieldName]: initialValue,
    },
    onSubmit: values => {
      updateTransporterPlate({
        variables: { id: bsd.id, [mutationFieldName]: values[fieldName] },
      });
    },
  });

  if (bsd.status !== CommonBsdStatus.Sealed) {
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
            <button className="btn btn--primary" type="submit">
              Modifier
            </button>
          </div>
        </form>
      </TdModal>
    </>
  );
}
