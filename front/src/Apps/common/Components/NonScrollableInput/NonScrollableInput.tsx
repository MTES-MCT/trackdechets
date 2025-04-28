import React from "react";
import Input, { InputProps } from "@codegouvfr/react-dsfr/Input";

export default function NonScrollableInput(props: InputProps) {
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
        ...props.nativeInputProps
      }}
    />
  );
}
