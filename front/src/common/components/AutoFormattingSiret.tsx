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
      onInit={owner => {
        // cleave.js doesn't seem to be maintained anymore
        // there's a know issue that's been reported since june 2020:
        // https://github.com/nosir/cleave.js/issues/601#issuecomment-902747682
        (owner as any).lastInputValue = "";
      }}
      className={`td-input ${styles.autoformattingSiret}`}
    />
  );
}
