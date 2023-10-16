import * as React from "react";
import { useQuery } from "@apollo/client";
import { Bsff, Query, QueryBsffArgs } from "generated/graphql/types";
import { ActionButton, Modal } from "common/components";
import { Loader } from "Apps/common/Components";
import { IconCheckCircle1 } from "Apps/common/Components/Icons/Icons";
import { GET_BSFF_FORM } from "form/bsff/utils/queries";
import { BsffSummary } from "./BsffSummary";

interface ChildrenProps {
  bsff: Bsff;
  onClose: () => void;
}

interface SignEmissionModalProps {
  title: string;
  bsffId: string;
  children: (props: ChildrenProps) => React.ReactNode;
  onClose: () => void;
}

function SignBsffModal({
  title,
  bsffId,
  children,
  onClose,
}: SignEmissionModalProps) {
  const { data } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF_FORM, {
    variables: {
      id: bsffId,
    },
  });

  if (data == null) {
    return <Loader />;
  }

  const { bsff } = data;

  return (
    <Modal onClose={onClose} ariaLabel={title} isOpen>
      <h2 className="td-modal-title">{title}</h2>
      <BsffSummary bsff={bsff} />
      {children({ bsff, onClose })}
    </Modal>
  );
}

interface SignBsffProps {
  title: string;
  bsffId: string;
  children: (props: ChildrenProps) => React.ReactNode;
}

export function SignBsff({ title, bsffId, children }: SignBsffProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        {title}
      </ActionButton>
      {isOpen && (
        <SignBsffModal
          title={title}
          bsffId={bsffId}
          onClose={() => setIsOpen(false)}
        >
          {children}
        </SignBsffModal>
      )}
    </>
  );
}
