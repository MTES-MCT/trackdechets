import React from "react";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";

export default function NonScrollableInput(props: InputProps) {
  const preventScientificNotation = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (["e", "E"].includes(event.key)) {
      event.preventDefault();
    }
  };

  if (props.textArea) {
    return (
      <Input
        {...props}
        nativeTextAreaProps={{
          ...props.nativeTextAreaProps
        }}
      />
    );
  }
  return (
    <Input
      {...props}
      nativeInputProps={{
        onWheel: event => {
          (event.target as HTMLInputElement).blur();
        },
        onKeyDown: event => {
          preventScientificNotation(event);
        },
        ...props.nativeInputProps
      }}
    />
  );
}
