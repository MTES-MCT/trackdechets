import React, { useState } from "react";
import TdSwitch from "common/components/Switch";
import { useField } from "formik";

type Props = {
  title: string;
  children: React.ReactNode;
  name: string;
  defaultValue: any;
  value: string | number | React.ReactNode;
  disabled?: boolean;
};

export function ReviewableField({
  value,
  title,
  name,
  defaultValue,
  children,
  disabled = false,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [, , { setValue }] = useField(name);

  function handleIsEditingChange() {
    if (isEditing) {
      setValue(defaultValue);
    }
    setIsEditing(!isEditing);
  }
  return (
    <div className="tw-pb-4">
      <div className="tw-flex">
        <TdSwitch
          disabled={disabled}
          checked={isEditing}
          onChange={handleIsEditingChange}
          label={""}
          className=""
        />
        <span className="tw-font-bold tw-pr-2">{title} :</span> {value}
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
