import React from "react";
import Cleave from "cleave.js/react";
import styles from "./AutoFormattingSiret.module.scss";

/**
 * Cleave component to format typed sirets on the fly (eg. 333 330 581 00012)
 */
export default function AutoFormattingSiret({ field, form, ...props }) {
  return (
    <Cleave
      options={{ blocks: [3, 3, 3, 5] }}
      {...field}
      {...props}
      className={`td-input ${styles.autoformattingSiret}`}
    />
  );
}
