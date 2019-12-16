import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";
import Tooltip from "../../common/Tooltip";

type Props = {
  name: string;
  label: string;
  value: string | ReactNode | undefined;
  /**
   * Render prop
   */
  renderForm: (toggleEdition: () => void) => ReactNode;
  tooltip?: string;
  modifier?: string;
};

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

  const m = !!value ? modifier : "Ajouter";

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={name}>
        {label}
        {tooltip && <Tooltip msg={tooltip} />}
      </label>
      <div id={name} className={styles.field__value}>
        {!editing ? value : form}
      </div>
      {modifier && (
        <div className={styles.modifier} onClick={toggleEdition}>
          {!editing ? (!!value ? modifier : "Ajouter") : "Annuler"}
        </div>
      )}
    </div>
  );
}
