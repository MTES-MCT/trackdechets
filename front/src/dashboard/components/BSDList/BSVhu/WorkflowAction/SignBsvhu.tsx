import { ActionButton } from "../../../../../common/components";
import { IconCheckCircle1 } from "../../../../../Apps/common/Components/Icons/Icons";
import React, { useState } from "react";
import { SignBsvhuModal } from "./SignBsvhuModal";

type Props = {
  title: string;
  bsvhuId: string;
  children: (props: { bsvhu; onClose }) => React.ReactNode;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
};

export function SignBsvhu({
  title,
  bsvhuId,
  children,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {displayActionButton && (
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
      )}
      {isModalOpenFromParent && (
        <SignBsvhuModal
          title={title}
          bsvhuId={bsvhuId}
          onClose={onModalCloseFromParent!}
        >
          {children}
        </SignBsvhuModal>
      )}
    </>
  );
}
