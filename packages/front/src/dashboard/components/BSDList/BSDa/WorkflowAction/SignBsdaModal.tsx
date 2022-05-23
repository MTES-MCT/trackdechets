import { useQuery } from "@apollo/client";
import { Loader, Modal } from "common/components";
import { GET_BSDA } from "form/bsda/stepper/queries";
import { Query, QueryBsdaArgs } from "@trackdechets/codegen/src/front.gen";
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
    }
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsda } = data;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>
      <BsdaSummary bsda={bsda} />
      {children({ bsda, onClose })}
    </Modal>
  );
}
