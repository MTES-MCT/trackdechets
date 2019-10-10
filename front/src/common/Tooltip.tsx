import React, { useState } from "react";
import "./Tooltip.scss";

type Props = {
  msg?: string;
};

/**
 * Icon displaying help text when hovered
 * @param msg string
 */
const Tooltip = ({ msg }: Props) => {
  const [display, setDisplay] = useState(false);
  return !!msg ? (
    <span className="tooltip__container">
      <span
        role="button"
        className="tooltip__trigger"
        onMouseOver={() => setDisplay(true)}
        onMouseLeave={() => setDisplay(false)}
      >
        <img src="disposal-icon.jpg" height="32" alt="Aide" />
      </span>

      {display && <p className="tooltip__content"> {msg} </p>}
    </span>
  ) : null;
};

export default Tooltip;
