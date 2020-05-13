import React from "react";
import { formatDate } from "./helper";

/**
 * This component should be passed as prop to a formik Field
 * to create a date input. When passed an initial string value, the call
 * to formatDate ensures the date is represented correctly in the
 * selector
 * Cf https://developer.mozilla.org/fr/docs/Web/HTML/Formats_date_heure_HTML#Repr%C3%A9sentation_des_dates
 */
export default function DateInput({ field, ...props }) {
  const { value, ...rest } = field;
  const date = new Date(value);
  return (
    <input type="date" value={formatDate(date)} {...rest} {...props}></input>
  );
}
