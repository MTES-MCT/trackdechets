import React, { useState } from "react";

import { ChevronDown, ChevronUp } from "./Icons";
import { COLORS } from "src/common/config";

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
          <ChevronUp size={18} color={COLORS.blueLight} />
        ) : (
          <ChevronDown size={18} color={COLORS.blueLight} />
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
