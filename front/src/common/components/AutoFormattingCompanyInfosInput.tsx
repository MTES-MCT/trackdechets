import React from "react";
import Cleave from "cleave.js/react";
import styles from "./AutoFormattingCompanyInfosInput.module.scss";

/**
 * Cleave component to format typed SIRETs on the fly (eg. 333 330 581 00012)
 */
export default function AutoFormattingCompanyInfosInput({
  field,
  form,
  ...props
}) {
  return (
    <Cleave
      options={{
        uppercase: true,
        stripLeadingZeroes: false
      }}
      {...field}
      {...props}
      onInit={owner => {
        // cleave.js doesn't seem to be maintained anymore
        // there's a know issue that's been reported since june 2020:
        // https://github.com/nosir/cleave.js/issues/601#issuecomment-902747682
        (owner as any).lastInputValue = "";
      }}
      className={`td-input ${styles.autoformattingCompanyInfosInput}`}
    />
  );
}
