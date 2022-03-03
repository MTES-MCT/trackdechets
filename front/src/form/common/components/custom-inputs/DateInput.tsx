import { parseDate } from "common/datetime";
import { format } from "date-fns";
import fr from "date-fns/locale/fr";
import { FieldProps } from "formik";
import React from "react";
import DatePicker, {
  ReactDatePickerProps,
  registerLocale,
  setDefaultLocale,
} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DateInput.module.scss";

registerLocale("fr", fr);
setDefaultLocale("fr");

export default function DateInput({
  field,
  form: { setFieldValue },
  ...props
}: FieldProps<string | null> & {
  label: string;
} & ReactDatePickerProps) {
  const { value, ...rest } = field;

  return (
    <DatePicker
      {...rest}
      {...props}
      dateFormat="dd/MM/yyyy"
      selected={value ? parseDate(value) : null}
      onChange={(value: Date | null) => {
        setFieldValue(field.name, value ? format(value, "yyyy-MM-dd") : null);
      }}
    />
  );
}
