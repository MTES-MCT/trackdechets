import React, { useState } from "react";
import TdSwitch from "../../../../../common/components/Switch";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultValue: any;
  onChange: (toggled: boolean) => void;
  disabled?: boolean;
};

export function Switch({
  title,
  defaultValue,
  onChange,
  disabled = false,
  children
}: Props) {
  const [isToggled, setIsToggled] = useState(defaultValue);

  const onToggle = () => {
    setIsToggled(!isToggled);
    onChange(!isToggled);
  };

  return (
    <div className="tw-pb-4">
      <div className="tw-flex">
        <TdSwitch
          checked={isToggled}
          onChange={onToggle}
          label={""}
          className=""
          disabled={disabled}
        />
        <span className="tw-font-bold tw-pr-2">{title}</span>
      </div>

      <div className="form__row tw-border-l-2 tw-border-blue-700 tw-pl-2">
        {children}
      </div>
    </div>
  );
}
