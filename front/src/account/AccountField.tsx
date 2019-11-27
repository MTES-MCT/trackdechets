import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";

type Props = {
  /**
   * Render prop
   */
  render: (toggleEdition: any, state: { editing: boolean }) => ReactNode;
};

export default function AccountField({ render }: Props) {
  const [editing, setEditing] = useState(false);

  const toggleEdition = () => {
    setEditing(!editing);
  };

  const classes = [styles.field, ...(editing ? [styles.editing] : [])];

  return (
    <div className={classes.join(" ")}>
      {render(toggleEdition, { editing })}
    </div>
  );
}
