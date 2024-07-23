import { useQuery } from "@apollo/client";

import { Loader } from "../../../../../Apps/common/Components";
import {
  DsfrModal,
  ModalSizes
} from "../../../../../Apps/common/Components/Modal/DsfrModal";
import { Query, QueryFormArgs } from "@td/codegen-ui";
import React from "react";
import { FormSummary } from "./FormSummary";
import { GET_FORM } from "../../../../common/queries/bsdd/queries";

type Props = {
  title: string;
  formId: string;
  children: (props: { form; onClose }) => React.ReactNode;
  onClose: () => void;
  size: string;
};

export function SignFormModal({
  title,
  formId,
  children,
  onClose,
  size
}: Readonly<Props>) {
  const { data } = useQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
    variables: {
      id: formId
    }
  });

  if (data == null) {
    return <Loader />;
  }

  const { form } = data;

  return (
    <DsfrModal
      title={title}
      onClose={onClose}
      size={size as ModalSizes}
      padding={true}
    >
      <FormSummary form={form} />
      {children({ form, onClose })}
    </DsfrModal>
  );
}
