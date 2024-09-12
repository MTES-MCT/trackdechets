import { ActionButton } from "../../../../../common/components";
import { IconCheckCircle1 } from "../../../../common/Components/Icons/Icons";
import React, { useState } from "react";
import { SignBspaohModal } from "./SignBspaohModal";

type Props = {
  title: string;
  bspaohId: string;
  children: (props: { bspaoh; onClose }) => React.ReactNode;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
  size?: string;
};

export function SignBspaoh({
  title,
  bspaohId,
  children,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true,
  size = "L"
}: Readonly<Props>) {
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
            <SignBspaohModal
              title={title}
              bspaohId={bspaohId}
              size={size}
              onClose={() => setIsOpen(false)}
            >
              {children}
            </SignBspaohModal>
          )}
        </>
      )}
      {isModalOpenFromParent && (
        <SignBspaohModal
          title={title}
          bspaohId={bspaohId}
          size={size}
          onClose={onModalCloseFromParent!}
        >
          {children}
        </SignBspaohModal>
      )}
    </>
  );
}
