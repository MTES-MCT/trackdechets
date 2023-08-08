import React, { useState } from "react";
import TdSwitch from "common/components/Switch";
import { useField } from "formik";

type Props = {
  title: string;
  children: React.ReactNode;
  name: string;
  // Value coming from revised bsd, allowing reset when component is closed
  defaultValue: any;
  // Optional value to initialize children field value, usefule for booleans
  initialValue?: any;
  value: string | number | React.ReactNode;
};

export function ReviewableField({
  value,
  title,
  name,
  defaultValue,
  initialValue,
  children,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [, , { setValue }] = useField(name);

  function handleIsEditingChange() {
    if (isEditing) {
      // When toggling visibility to off, set children value to pre-existing value
      setValue(defaultValue);
    } else {
      // When toggling visibility to on, set children value to optional initialValue (to tell apart empty strings from boolean)
      if (initialValue !== undefined) setValue(initialValue);
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
