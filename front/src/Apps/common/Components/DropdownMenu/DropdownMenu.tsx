import React, { useState } from "react";
import { Link } from "react-router-dom";
import FocusTrap from "focus-trap-react";
import useOnClickOutsideRefTarget from "../../hooks/useOnClickOutsideRefTarget";
import { DropdownMenuProps } from "./dropdownMenuTypes";
import cn from "classnames";

import "./dropdownMenu.scss";

const DropdownMenu = ({
  menuTitle,
  className,
  ButtonElement,
  links,
  isDisabled,
  iconId,
  iconAlone,
  primary,
  alignRight
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
        className={cn("dropdown-menu", className, {
          "dropdown-menu--primary": primary
        })}
      >
        {ButtonElement ? (
          <ButtonElement
            id="create-bsd-btn"
            disabled={isDisabled}
            onClick={toggleMenu}
            isOpen={isOpen}
            menuTitle={menuTitle}
          />
        ) : (
          <button
            id="create-bsd-btn"
            className={cn(
              `menu-btn fr-btn fr-btn--${primary ? "primary" : "secondary"}`,
              {
                isOpen: isOpen,
                "menu-btn__iconAlone": iconAlone
              },
              ...(iconId ? ["fr-btn--icon-left", iconId] : [])
            )}
            disabled={isDisabled}
            onClick={toggleMenu}
            aria-label={isOpen ? `Fermer ${menuTitle}` : `Ouvrir ${menuTitle}`}
          >
            {menuTitle}
          </button>
        )}
        {isOpen && (
          <ul
            className={cn("dropdown-menu__content", {
              "dropdown-menu__content__iconAlone": iconAlone,
              "align-right": alignRight
            })}
          >
            {links.map(link => {
              return (
                <li key={link.title}>
                  {link.isButton ? (
                    <button
                      type="button"
                      className={cn("fr-btn fr-btn--tertiary-no-outline", [
                        ...(link.iconId ? [iconId, "fr-btn--icon-left"] : [])
                      ])}
                      onClick={e => {
                        closeMenu();
                        !!link.handleClick && link.handleClick(e);
                      }}
                    >
                      {link.icon && (
                        <span
                          className="dropdown-menu__content__icon"
                          aria-hidden
                        >
                          {link.icon}
                        </span>
                      )}
                      <span className="sr-only">{link.title}</span>
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
                        <span
                          className="dropdown-menu__content__icon"
                          aria-hidden
                        >
                          {link.icon}
                        </span>
                      )}
                      {link.iconId && (
                        <span
                          aria-hidden
                          className={cn([iconId, "fr-btn--icon-left"])}
                        ></span>
                      )}
                      <span className="fr-sr-only">{link.title}</span>
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
