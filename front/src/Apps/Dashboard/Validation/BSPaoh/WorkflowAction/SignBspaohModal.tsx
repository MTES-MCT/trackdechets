import { useQuery } from "@apollo/client";

import { Loader } from "../../../../common/Components";
import { GET_BSPAOH } from "../../../../../Apps/common/queries/bspaoh/queries";

import { Query, QueryBspaohArgs } from "@td/codegen-ui";
import React from "react";
import { BspaohSummary } from "./BspaohSummary";
import TdModal, { ModalSizes } from "../../../../common/Components/Modal/Modal";

type Props = {
  title: string;
  bspaohId: string;
  children: (props: { bspaoh; onClose }) => React.ReactNode;
  onClose: () => void;
  size: string;
};

export function SignBspaohModal({
  title,
  bspaohId,
  children,
  onClose,
  size
}: Readonly<Props>) {
  const { data } = useQuery<Pick<Query, "bspaoh">, QueryBspaohArgs>(
    GET_BSPAOH,
    {
      variables: {
        id: bspaohId
      }
    }
  );

  if (data == null) {
    return <Loader />;
  }

  const { bspaoh } = data;

  return (
    <TdModal
      onClose={onClose}
      title={title}
      ariaLabel="fermer la modale"
      isOpen
      size={size as ModalSizes}
    >
      <BspaohSummary bspaoh={bspaoh} />
      {children({ bspaoh, onClose })}
    </TdModal>
  );
}
