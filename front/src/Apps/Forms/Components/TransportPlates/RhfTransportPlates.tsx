import React from "react";
import { BsdType } from "@td/codegen-ui";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useFormContext, Controller } from "react-hook-form";
import { RhfTagsInputWrapper } from "../TagsInput/TagsInputWrapper";

type RhfTransporterTransportPlatesProps = {
  readonly bsdType: BsdType;
  readonly fieldName: string;
};

const RhfTransportPlates = ({
  bsdType,
  fieldName
}: RhfTransporterTransportPlatesProps): React.JSX.Element => {
  const { control } = useFormContext();

  if (bsdType === BsdType.Bsdd) {
    return (
      <Controller
        control={control}
        name={fieldName}
        render={({ field }) => (
          <Input label="Immatriculation" nativeInputProps={field} />
        )}
      />
    );
  } else {
    return (
      <RhfTagsInputWrapper
        label="Immatriculations"
        fieldName={fieldName}
        maxTags={2}
      />
    );
  }
};

export default RhfTransportPlates;
