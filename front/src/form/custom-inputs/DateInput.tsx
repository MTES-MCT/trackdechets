import React from "react";
import { FieldProps } from "formik";
import { parseDate } from "common/datetime";
import fr from "date-fns/locale/fr";
import DatePicker, {
  setDefaultLocale,
  registerLocale,
  ReactDatePickerProps,
} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    <div>
      <DatePicker
        {...rest}
        {...props}
        dateFormat="dd/MM/yyyy"
        selected={value ? parseDate(value) : null}
        onChange={(value: Date | null) => {
          setFieldValue(field.name, value?.toISOString() ?? null);
        }}
      />
    </div>
  );
}
