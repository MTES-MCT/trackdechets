import { useQuery } from "@apollo/client";
import { Modal } from "../../../../../common/components";
import { Loader } from "../../../../../Apps/common/Components";
import { GET_VHU_FORM } from "../../../../../Apps/common/queries/bsvhu/queries";
import { Query, QueryBsvhuArgs } from "@td/codegen-ui";
import React from "react";
import { BsvhuSummary } from "./BsvhuSummary";

type Props = {
  title: string;
  bsvhuId: string;
  children: (props: { bsvhu; onClose }) => React.ReactNode;
  onClose: () => void;
};

export function SignBsvhuModal({ title, bsvhuId, children, onClose }: Props) {
  const { data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsvhuId
      }
    }
  );

  if (data == null) {
    return <Loader />;
  }

  const { bsvhu } = data;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen size="L">
      <h2 className="td-modal-title">{title}</h2>
      <BsvhuSummary bsvhu={bsvhu} />
      {children({ bsvhu, onClose })}
    </Modal>
  );
}
