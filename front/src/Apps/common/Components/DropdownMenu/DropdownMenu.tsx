import cn from "classnames";
import FocusTrap from "focus-trap-react";
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ComboBox } from "../Combobox/Combobox";
import { DropdownMenuProps } from "./dropdownMenuTypes";

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div
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
          ref={triggerRef}
        />
      ) : (
        <button
          id="create-bsd-btn"
          type="button"
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
          ref={triggerRef}
        >
          {menuTitle}
        </button>
      )}
      <ComboBox
        parentRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={open => setIsOpen(open)}
        autoWidth={true}
      >
        {() => (
          <FocusTrap active={isOpen}>
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
                        <span className="sr-only">{menuTitle}</span>
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
                        className="fr-raw-link"
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
                        <span className="fr-sr-only">{menuTitle}</span>
                        {link.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </FocusTrap>
        )}
      </ComboBox>
    </div>
  );
};

export default DropdownMenu;
