import React, { ReactNode } from "react";
import styles from "./AccountField.module.scss";
import Tooltip from "../../common/Components/Tooltip/Tooltip";

type Props = {
  name: string;
  label: string;
  value: string | ReactNode | undefined;
  tooltip?: string;
  insideForm?: ReactNode;
};

export default function AccountFieldNotEditable({
  name,
  label,
  value,
  tooltip,
  insideForm
}: Props) {
  const classes = [styles.field];

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={name} className="text-right">
        {label}
        {tooltip && <Tooltip className="fr-ml-1w" title={tooltip} />}
      </label>
      <div id={name} className={styles.field__value}>
        {value}
      </div>
      {insideForm}
    </div>
  );
}
