import React, { useCallback, useState } from "react";
import { format } from "date-fns";
import fr from "date-fns/locale/fr";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import Input from "@codegouvfr/react-dsfr/Input";

import "react-datepicker/dist/react-datepicker.css";

registerLocale("fr", fr);
setDefaultLocale("fr");

const DatePickerWrapper = ({ onDateChange, label = "", errorMessage = "" }) => {
  const [startDate, setStartDate] = useState<Date>();

  const handleChange = useCallback(
    date => {
      if (date) {
        setStartDate(date);
        onDateChange(format(date, "yyyy-MM-dd"));
      }
    },
    [onDateChange]
  );

  return (
    <DatePicker
      dateFormat="dd/MM/yyyy"
      autoComplete="off"
      selected={startDate}
      onChange={handleChange}
      customInput={
        <Input
          label={label}
          iconId="fr-icon-calendar-fill"
          state={errorMessage ? "error" : "default"}
          stateRelatedMessage={errorMessage}
          nativeInputProps={{
            value: startDate ? format(startDate, "dd/MM/yyyy") : "",
            readOnly: true,
          }}
        />
      }
      onChangeRaw={e => {
        // disable manual entry
        e.preventDefault();
      }}
    />
  );
};

export default React.memo(DatePickerWrapper);
