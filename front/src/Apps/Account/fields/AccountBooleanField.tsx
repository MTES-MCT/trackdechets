import React, { ReactNode, useState } from "react";
import styles from "./AccountField.module.scss";
import classNames from "classnames";
import Tooltip from "../../common/Components/Tooltip/Tooltip";

type Props = {
  // the name of the field
  name: string;
  // A verbose title to be displayed on the left side fo the checkbox
  title: string;
  // Is this row editable or read-only ?
  editable: boolean;
  // the value of the field
  value: string | number | ReactNode;
  // a render props for the form
  // an optional tooltip to display next to the label
  tooltip?: string;
  renderForm: (toggleEdition: () => void, editing: boolean) => ReactNode;
};

/**
 * This is a tweaked version of AccountField to handle a simple boolean value
 * As we have to render a checkbox even in view mode, we rely on the passed form i/o
 * Conditionnaly rendering a form or a string
 */
export default function AccountBooleanField({
  name,
  title,
  editable,
  value,
  renderForm,
  tooltip
}: Props) {
  const [editing, setEditing] = useState(false);

  const toggleEdition = () => {
    setEditing(!editing);
  };

  const initialValues = {};
  initialValues[name] = value;

  const form = renderForm(toggleEdition, editing);

  return (
    <div className={classNames(styles.field, { [styles.editing]: editing })}>
      <span className={styles.label}>
        {title} {tooltip && <Tooltip className="fr-ml-1w" title={tooltip} />}
      </span>
      <div className={styles.field__value}>{form}</div>

      {editable && (
        <div
          className={`${styles.modifier} btn btn--primary`}
          onClick={toggleEdition}
        >
          {!editing ? "Modifier" : "Annuler"}
        </div>
      )}
    </div>
  );
}
