import React from "react";
import { useForm } from "react-hook-form";
import { FormBuilder } from "../builder/FormBuilder";
import { ssdFormShape } from "./shape";

export function RegistrySsdForm() {
  const methods = useForm<{}>({});

  return (
    <FormBuilder
      methods={methods}
      shape={ssdFormShape}
      onSubmit={data => console.log(data)}
    />
  );
}
