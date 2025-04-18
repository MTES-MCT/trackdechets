import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { FormBuilder } from "../builder/FormBuilder";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  IncomingTexsLineInput,
  RegistryImportType,
  RegistryLineReason
} from "@td/codegen-ui";
import React from "react";
import { incomingTexsFormShape } from "./shape";

type Props = { onClose: () => void };

export function RegistryIncomingTexsForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const loadingLookup = false; // todo
  const saving = false; // todo
  const disabledFieldNames = []; // todo

  const methods = useForm<IncomingTexsLineInput>({
    defaultValues: {
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined
    }
    //resolver: zodResolver(schemaFromShape(ssdFormShape))
  });

  async function onSubmit(data: any) {
    console.log(data);
  }

  return loadingLookup ? (
    <Loader />
  ) : (
    <FormBuilder
      registryType={RegistryImportType.IncomingTexs}
      methods={methods}
      shape={incomingTexsFormShape}
      onSubmit={onSubmit}
      loading={saving}
      disabledFieldNames={disabledFieldNames}
    />
  );
}
