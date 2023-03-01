import React from "react";
import { inputType } from "../../types/commonTypes";

interface InputProps {
  label?: string;
  name: string;
  id?: string;
  type: inputType;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, id, type, onChange }, ref) => {
    return (
      <>
        {label && (
          <label className="fr-label" htmlFor={id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className="fr-input"
          type={type}
          id={id}
          name={name}
          onChange={onChange}
        ></input>
      </>
    );
  }
);

export default React.memo(Input);
