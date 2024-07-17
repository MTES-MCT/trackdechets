import { useQuery } from "@apollo/client";
import { Loader } from "../../../../../Apps/common/Components";
import { Modal } from "../../../../../common/components";
import { GET_BSDA } from "../../../../../Apps/common/queries/bsda/queries";
import { Query, QueryBsdaArgs } from "@td/codegen-ui";
import React from "react";
import { BsdaSummary } from "./BsdaSummary";

type Props = {
  title: string;
  bsdaId: string;
  children: (props: { bsda; onClose }) => React.ReactNode;
  onClose: () => void;
};

export function SignBsdaModal({ title, bsdaId, children, onClose }: Props) {
  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId
    },
    fetchPolicy: "network-only"
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen size="L">
      <h2 className="td-modal-title">{title}</h2>
      <BsdaSummary bsda={bsda} />
      {children({ bsda, onClose })}
    </Modal>
  );
}
