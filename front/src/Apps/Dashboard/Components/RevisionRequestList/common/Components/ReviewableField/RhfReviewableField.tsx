import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { isDefined } from "../../../../../../../common/helper";

type Props = {
  readonly title: string;
  readonly suffix?: string;

  // help text
  readonly hint?: string;
  // The variable path: eg; `destination.operation.weight`
  readonly path: string;
  // The value to display
  readonly value: string | number | React.ReactNode;
  // Value coming from revised bsd, allowing reset when component is closed
  readonly defaultValue: any;
  // Optional value to initialize children field value, useful for booleans
  readonly initialValue?: any;

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
  isDefined(value) ? (
    <span>
      {labelText} :{" "}
      <strong>
        {value} {suffix}
      </strong>
    </span>
  ) : (
    <span>{labelText}</span>
  );

const RhfReviewableField = ({
  title,
  suffix,
  value,
  defaultValue,
  initialValue,
  path,
  hint,

  children,
  disabled = false
}: Props) => {
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
    <div className="fr-mb-4w">
      <ToggleSwitch
        label={<LabelContent labelText={title} value={value} suffix={suffix} />}
        inputTitle="terms" // todo: change
        defaultChecked={false}
        helperText={hint}
        onChange={handleIsEditingChange}
        disabled={disabled}
      />
      {isEditing && <div className="fr-ml-9w fr-mt-2w">{children} </div>}
    </div>
  );
};

export default RhfReviewableField;
