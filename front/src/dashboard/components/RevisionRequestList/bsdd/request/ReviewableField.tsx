import React, { useState } from "react";
import TdSwitch from "common/components/Switch";

type Props = {
  title: string;
  children: React.ReactNode;
  value: string | number | React.ReactNode;
};

export function ReviewableField({ value, title, children }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  function handleIsEditingChange() {
    if (isEditing) {
      // TODO clear value
    }
    setIsEditing(!isEditing);
  }
  return (
    <div className="tw-pb-4">
      <div className="tw-flex">
        <TdSwitch
          checked={isEditing}
          onChange={handleIsEditingChange}
          label={""}
          className=""
        />
        <span className="tw-font-bold tw-pr-2">{title}:</span> {value}
      </div>

      {isEditing && (
        <div className="form__row tw-border-l-2 tw-border-blue-700 tw-pl-2">
          <label className="tw-font-bold">Nouvelle valeur - {title}</label>
          {children}
        </div>
      )}
    </div>
  );
}
