import React, { useState } from "react";
import { Link } from "react-router-dom";
import FocusTrap from "focus-trap-react";
import useOnClickOutsideRefTarget from "Apps/common/hooks/useOnClickOutsideRefTarget";
import { DropdownMenuProps } from "./dropdownMenuTypes";
import classNames from "classnames";

import "./dropdownMenu.scss";

const DropdownMenu = ({
  menuTitle,
  links,
  isDisabled,
  iconAlone,
}: DropdownMenuProps) => {
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
          className={classNames("menu-btn fr-btn fr-btn--secondary", {
            isOpen: isOpen,
            "menu-btn__iconAlone": iconAlone,
          })}
          disabled={isDisabled}
          onClick={e => {
            setIsOpen(false);
            onClick();
          }}
        >
          {menuTitle}
        </button>
        {isOpen && (
          <ul
            className={classNames("dropdown-menu__content", {
              "dropdown-menu__content__iconAlone": iconAlone,
            })}
          >
            {links.map(link => {
              return (
                <li key={link.title}>
                  {link.isButton ? (
                    <button
                      type="button"
                      className="fr-btn fr-btn--tertiary-no-outline"
                      onClick={e => {
                        setIsOpen(false);
                        !!link.handleClick && link.handleClick(e);
                      }}
                    >
                      {link.icon && (
                        <span className="dropdown-menu__content__icon">
                          {link.icon}
                        </span>
                      )}
                      {link.title}
                    </button>
                  ) : (
                    <Link
                      to={
                        typeof link.route === "string"
                          ? link.route
                          : { ...link.route }
                      }
                    >
                      {link.icon && (
                        <span className="dropdown-menu__content__icon">
                          {link.icon}
                        </span>
                      )}
                      {link.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FocusTrap>
  );
};

export default DropdownMenu;
