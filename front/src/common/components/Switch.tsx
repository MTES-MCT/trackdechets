import React, { useState } from "react";
import Switch from "react-switch";
import { uuid } from "uuidv4";
import "./Switch.scss";
export default function TdSwitch({
  onChange,
  checked,
  label,
}: {
  onChange: () => void;
  checked: boolean;
  label: string;
}) {
  const [uniqId] = useState(() => uuid());
  return (
    <div className="switch__container">
      <Switch
        onChange={() => onChange()}
        checked={checked}
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
