import React, { useState } from "react";
import { IconChevronDown, IconChevronUp } from "./Icons";

export const MenuDropDown = props => {
  const [dropdownOpened, toggleDropdown] = useState(false);

  return (
    <div className="slips-actions">
      <button
        onClick={() => toggleDropdown(!dropdownOpened)}
        className="slips-actions-trigger"
      >
        <span>Actions</span>{" "}
        {dropdownOpened ? (
          <IconChevronUp size="18px" color="blueLight" />
        ) : (
          <IconChevronDown size="18px" color="blueLight" />
        )}
      </button>
      {dropdownOpened && (
        <div className="slips-actions__content">
          <ul className="slips-actions__items">{props.children}</ul>
        </div>
      )}
    </div>
  );
};
