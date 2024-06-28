import { ActionButton } from "../../../../../common/components";
import { IconCheckCircle1 } from "../../../../../Apps/common/Components/Icons/Icons";
import React, { useState } from "react";
import { SignFormModal } from "./SignFormModal";

type Props = {
  title: string;
  formId: string;
  children: (props: { form; onClose }) => React.ReactNode;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
  size?: string;
};

export function SignForm({
  title,
  formId,
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
            <SignFormModal
              title={title}
              formId={formId}
              size={size}
              onClose={() => setIsOpen(false)}
            >
              {children}
            </SignFormModal>
          )}
        </>
      )}
      {isModalOpenFromParent && (
        <SignFormModal
          title={title}
          formId={formId}
          size={size}
          onClose={onModalCloseFromParent!}
        >
          {children}
        </SignFormModal>
      )}
    </>
  );
}
