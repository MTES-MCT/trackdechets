import React, { useState } from "react";
import { Link } from "react-router-dom";
import FocusTrap from "focus-trap-react";
import useOnClickOutsideRefTarget from "../../../../common/hooks/useOnClickOutsideRefTarget";
import { DropdownMenuProps } from "./dropdownMenuTypes";

import "./dropdownMenu.scss";

const DropdownMenu = ({ menuTitle, links, isDisabled }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => setIsOpen(false),
  });

  const onClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <FocusTrap active={isOpen}>
      <div
        ref={targetRef as React.RefObject<HTMLDivElement>}
        className="dropdown-menu"
      >
        <button
          className="fr-btn fr-btn--secondary"
          disabled={isDisabled}
          onClick={onClick}
        >
          {menuTitle}
        </button>
        {isOpen && (
          <div className="dropdown-menu__content">
            {links.map(link => (
              <Link to={link.route} key={link.title}>
                {link.icon && (
                  <span className="dropdown-menu__content__icon">
                    {link.icon}
                  </span>
                )}
                {link.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </FocusTrap>
  );
};

export default DropdownMenu;
