import React, { ReactNode } from "react";
import styles from "./AccountField.module.scss";
import ToolTip from "../../common/Tooltip";

type Props = {
  name: string;
  label: string;
  value: string | ReactNode | undefined;
  tooltip?: string;
};

export default function AccountFieldNotEditable({
  name,
  label,
  value,
  tooltip,
}: Props) {
  const classes = [styles.field];

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={name} className="text-right">
        {label}
        {tooltip && <ToolTip msg={tooltip} />}
      </label>
      <div id={name} className={styles.field__value}>
        {value}
      </div>
    </div>
  );
}
