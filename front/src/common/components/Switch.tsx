import React, { useState } from "react";
import ReactSwitch, { ReactSwitchProps } from "react-switch";
import { v4 as uuidv4 } from "uuid";
import "./Switch.scss";

interface SwitchProps extends ReactSwitchProps {
  label: string;
}

export default function Switch({ label, ...props }: SwitchProps) {
  const [uniqId] = useState(() => uuidv4());

  return (
    <div className="switch__container">
      <ReactSwitch
        {...props}
        uncheckedIcon={false}
        checkedIcon={false}
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
        height={12}
        width={30}
        handleDiameter={20}
        id={`switch-${uniqId}`}
      />

      <label htmlFor={`switch-${uniqId}`} className="tw-ml-2">
        {label}
      </label>
    </div>
  );
}
