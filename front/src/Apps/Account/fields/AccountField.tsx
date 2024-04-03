import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";
import Tooltip from "../../../common/components/Tooltip";

type Props = {
  // the name of the field
  name: string;
  // the label of the field
  label: string;
  // the value of the field
  value: string | number | ReactNode;
  // a render props for the form
  renderForm: (toggleEdition: () => void) => ReactNode;
  // an optional tooltip to display next to the label
  tooltip?: string;
  // an optional custom modifier text. Default is "Modifier"
  modifier?: string;
};

/**
 * This component displays an editable account field
 * Initially a label, a field value and modifier are present.
 * When clicking the modifier, specific style is applied and
 * the form should appear. The function `toggleEdition` is passed
 * down to the form to close the edition mode.
 */
export default function AccountField({
  name,
  label,
  value,
  renderForm,
  tooltip,
  modifier = "Modifier"
}: Props) {
  const [editing, setEditing] = useState(false);

  const toggleEdition = () => {
    setEditing(!editing);
  };

  const classes = [styles.field, ...(editing ? [styles.editing] : [])];

  const initialValues = {};
  initialValues[name] = value;

  const form = renderForm(toggleEdition);

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={name} className="text-right">
        {label}
        {tooltip && <Tooltip msg={tooltip} />}
      </label>
      <div id={name} className={styles.field__value}>
        {!editing ? value : form}
      </div>
      {modifier && (
        <div
          className={`${styles.modifier} btn btn--primary`}
          onClick={toggleEdition}
        >
          {!editing ? (!!value ? modifier : "Ajouter") : "Annuler"}
        </div>
      )}
    </div>
  );
}
