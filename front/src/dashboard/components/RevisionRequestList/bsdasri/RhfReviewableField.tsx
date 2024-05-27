import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

type Props = {
  readonly title: string;
  readonly suffix?: string;

  // help text
  readonly hint?: string;
  // The variable path: eg; `destination.operation.weight`
  readonly path: string;
  // Value coming from revised bsd, allowing reset when component is closed
  readonly defaultValue: any;
  // Optional value to initialize children field value, useful for booleans
  readonly initialValue?: any;
  readonly value: string | number | React.ReactNode;
  // is the field disabled
  readonly disabled?: boolean;

  children: React.ReactNode;
};

const LabelContent = ({
  labelText,
  suffix,

  value
}: {
  labelText: string;
  value: string | number | React.ReactNode;
  defaultValue?: string | number | React.ReactNode;
  suffix?: string;
}) =>
  !!value ? (
    <span>
      {labelText} :{" "}
      <strong>
        {value} {suffix}
      </strong>
    </span>
  ) : (
    <span>{labelText}</span>
  );

export function RhfReviewableField({
  title,
  suffix,
  defaultValue,
  value,
  path,
  hint,
  initialValue,

  children,
  disabled = false
}: Props) {
  const { setValue } = useFormContext(); // retrieve all hook methods
  const [isEditing, setIsEditing] = useState(false);

  function handleIsEditingChange() {
    if (isEditing) {
      // When toggling visibility to off, set children value to pre-existing value

      setValue(path, defaultValue);
    } else {
      // When toggling visibility to on, set children value to optional initialValue (to tell apart empty strings from boolean)
      if (initialValue !== undefined) setValue(path, initialValue);
    }
    setIsEditing(!isEditing);
  }

  return (
    <div>
      <ToggleSwitch
        label={<LabelContent labelText={title} value={value} suffix={suffix} />}
        inputTitle="terms" // todo: change
        defaultChecked={false}
        showCheckedHint={false}
        helperText={hint}
        onChange={handleIsEditingChange}
        disabled={disabled}
      />
      {isEditing && (
        <>
          <div className="fr-ml-9w">{children} </div>{" "}
          <hr className="fr-mt-1w" />
        </>
      )}
    </div>
  );
}
