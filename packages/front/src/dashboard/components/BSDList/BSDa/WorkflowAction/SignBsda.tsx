import { gql } from "@apollo/client";
import { ActionButton } from "common/components";
import { IconCheckCircle1 } from "common/components/Icons";
import React, { useState } from "react";
import { SignBsdaModal } from "./SignBsdaModal";

export const SIGN_BSDA = gql`
  mutation SignBsda($id: ID!, $input: BsdaSignatureInput!) {
    signBsda(id: $id, input: $input) {
      id
      status
    }
  }
`;

type Props = {
  title: string;
  bsdaId: string;
  children: (props: { bsda; onClose }) => React.ReactNode;
};

export function SignBsda({ title, bsdaId, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        {title}
      </ActionButton>
      {isOpen && (
        <SignBsdaModal
          title={title}
          bsdaId={bsdaId}
          onClose={() => setIsOpen(false)}
        >
          {children}
        </SignBsdaModal>
      )}
    </>
  );
}
