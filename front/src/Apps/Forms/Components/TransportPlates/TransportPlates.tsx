import React from "react";
import { BsdType } from "@td/codegen-ui";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field } from "formik";
import TagsInputWrapper from "../TagsInput/TagsInputWrapper";

type TransporterTransportPlatesProps = {
  readonly bsdType: BsdType;
  readonly fieldName: string;
};

const TransportPlates = ({
  bsdType,
  fieldName
}: TransporterTransportPlatesProps): React.JSX.Element => {
  if (bsdType === BsdType.Bsdd) {
    return (
      <Field name={fieldName}>
        {({ field }) => (
          <Input
            label="Immatriculation"
            nativeInputProps={field}
            hintText="Max 2 plaques, séparées par une virgule"
          />
        )}
      </Field>
    );
  } else {
    return (
      <TagsInputWrapper
        label="Immatriculations"
        fieldName={fieldName}
        maxTags={2}
      />
    );
  }
};

export default TransportPlates;
