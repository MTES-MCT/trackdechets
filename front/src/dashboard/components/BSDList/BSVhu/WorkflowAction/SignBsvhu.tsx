import { gql } from "@apollo/client";
import { ActionButton } from "common/components";
import { IconCheckCircle1 } from "Apps/common/Components/Icons/Icons";
import React, { useState } from "react";
import { SignBsvhuModal } from "./SignBsvhuModal";

export const SIGN_BSVHU = gql`
  mutation SignBsvhu($id: ID!, $input: BsvhuSignatureInput!) {
    signBsvhu(id: $id, input: $input) {
      id
      status
    }
  }
`;

type Props = {
  title: string;
  bsvhuId: string;
  children: (props: { bsvhu; onClose }) => React.ReactNode;
};

export function SignBsvhu({ title, bsvhuId, children }: Props) {
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
        <SignBsvhuModal
          title={title}
          bsvhuId={bsvhuId}
          onClose={() => setIsOpen(false)}
        >
          {children}
        </SignBsvhuModal>
      )}
    </>
  );
}
