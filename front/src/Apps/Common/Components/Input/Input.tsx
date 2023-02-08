import React from "react";
import { inputType } from "../../types/commonTypes";

interface InputProps {
  htmlFor?: string;
  label?: string;
  value: string;
  id?: string;
  type: inputType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ htmlFor, label, value, id, type, onChange }, ref) => {
    return (
      <>
        {label && (
          <label className="fr-label" htmlFor={htmlFor}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className="fr-input"
          type={type}
          id={id}
          name={value}
          onChange={onChange}
        ></input>
      </>
    );
  }
);

export default React.memo(Input);
