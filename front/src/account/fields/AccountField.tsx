import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";

type Props = {
  name: string;
  label: string;
  value: string | ReactNode | undefined;
  /**
   * Render prop
   */
  renderForm: (toggleEdition: () => void) => ReactNode;
  modifier: string | undefined;
};

export default function AccountField({
  name,
  label,
  value,
  renderForm,
  modifier
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
      <label htmlFor={name}>{label}</label>
      <div id={name} className={styles.field__value}>
        {!editing ? value : form}
      </div>
      {modifier && (
        <div className={styles.modifier} onClick={toggleEdition}>
          {!editing ? modifier : "Annuler"}
        </div>
      )}
    </div>
  );
}
