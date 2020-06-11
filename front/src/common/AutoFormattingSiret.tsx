import React from "react";
import Cleave from "cleave.js/react";
/**
 * Cleave component to format typed sirets on the fly (eg. 333 330 581 00012)
 */
export default function AutoFormattingSiret({ field, form, ...props }) {
  return <Cleave options={{ blocks: [3, 6, 5] }} {...field} {...props} />;
}
