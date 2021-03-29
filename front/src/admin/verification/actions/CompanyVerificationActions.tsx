import { CompanyForVerification } from "generated/graphql/types";
import React, { useState } from "react";
import CompanyVerifyModal from "./CompanyVerifyModal";
import { Menu, MenuButton, MenuList, MenuItem } from "@reach/menu-button";
import { IconChevronDown, IconChevronUp } from "common/components/Icons";
import styles from "./CompanyVerificationActions.module.scss";
import "@reach/menu-button/styles.css";
import classNames from "classnames";

type VerificationActionsProps = {
  company: CompanyForVerification;
};

export default function CompanyVerificationActions({
  company,
}: VerificationActionsProps) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const openVerifyModal = () => setShowVerifyModal(true);
  const closeVerifyModal = () => setShowVerifyModal(false);

  return (
    <>
      <Menu>
        {({ isExpanded }) => (
          <>
            <MenuButton
              className={classNames(
                "btn btn--outline-primary",
                styles.VerifyActionsToggle
              )}
            >
              Actions
              {isExpanded ? (
                <IconChevronUp size="14px" color="blueLight" />
              ) : (
                <IconChevronDown size="14px" color="blueLight" />
              )}
            </MenuButton>
            <MenuList>
              <MenuItem onSelect={() => openVerifyModal()}>Vérifier</MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
      {showVerifyModal && (
        <CompanyVerifyModal
          isOpen={showVerifyModal}
          onClose={() => closeVerifyModal()}
          company={company}
        />
      )}
    </>
  );
}
