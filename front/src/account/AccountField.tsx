import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";

type Props = {
  /**
   * Render prop
   */
  name: string;
  label: string;
  value: string | undefined;
  renderForm: (toggleEdition: () => void) => ReactNode;
  modifier: string;
};

export type Me = {
  name?: string;
  phone?: string;
  email?: string;
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
      <div id={name}>{!editing ? <span>{value}</span> : form}</div>
      <div className={styles.modifier} onClick={toggleEdition}>
        {!editing ? modifier : "Fermer"}
      </div>
    </div>
  );
}
