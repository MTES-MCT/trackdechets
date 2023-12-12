import React, { useState } from "react";
import { Link } from "react-router-dom";
import FocusTrap from "focus-trap-react";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";
import { DropdownMenuProps } from "./dropdownMenuTypes";
import classNames from "classnames";

import "./dropdownMenu.scss";

const DropdownMenu = ({
  menuTitle,
  links,
  isDisabled,
  iconAlone,
  primary
}: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { targetRef } = useOnClickOutsideRefTarget({
    onClickOutside: () => closeMenu()
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <FocusTrap active={isOpen}>
      <div
        ref={targetRef as React.RefObject<HTMLDivElement>}
        className={classNames("dropdown-menu", {
          "dropdown-menu--primary": primary
        })}
      >
        <button
          className={classNames(
            `menu-btn fr-btn fr-btn--${primary ? "primary" : "secondary"}`,
            {
              isOpen: isOpen,
              "menu-btn__iconAlone": iconAlone
            }
          )}
          disabled={isDisabled}
          onClick={toggleMenu}
        >
          {menuTitle}
        </button>
        {isOpen && (
          <ul
            className={classNames("dropdown-menu__content", {
              "dropdown-menu__content__iconAlone": iconAlone
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
                        closeMenu();
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
                      onClick={closeMenu}
                      state={link.state && { ...link.state }}
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
