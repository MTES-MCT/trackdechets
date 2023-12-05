import { parseDate } from "../../../../common/datetime";
import { format, isValid } from "date-fns";
import fr from "date-fns/locale/fr";
import { FieldProps } from "formik";
import React from "react";
import DatePicker, {
  ReactDatePickerProps,
  registerLocale,
  setDefaultLocale
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

  const getSelectedDate = () => {
    const parsedDate = value ? parseDate(value) : null;
    if (isValid(parsedDate)) {
      return parsedDate;
    }
  };
  return (
    <DatePicker
      {...rest}
      {...props}
      dateFormat="dd/MM/yyyy"
      autoComplete="off"
      selected={getSelectedDate()}
      onChange={(value: Date | null) => {
        setFieldValue(field.name, value ? format(value, "yyyy-MM-dd") : null);
      }}
      onChangeRaw={e => {
        // disable entering manual date
        e.preventDefault();
      }}
    />
  );
}
