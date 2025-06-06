import React, { useCallback, useEffect, useRef } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { formatError } from "../builder/error";

type Props = {
  name: string;
  methods: UseFormReturn<any>;
};

export function SecondaryWasteCodes({ methods }: Props) {
  const {
    fields: codeFields,
    append: appendCode,
    remove: removeCode
  } = useFieldArray({
    control: methods.control,
    name: "secondaryWasteCodes"
  });

  const {
    fields: descriptionFields,
    append: appendDescription,
    remove: removeDescription
  } = useFieldArray({
    control: methods.control,
    name: "secondaryWasteDescriptions"
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const addLine = useCallback(() => {
    appendCode({ value: "" });
    appendDescription({ value: "" });
  }, [appendCode, appendDescription]);

  function removeLine(index: number) {
    removeCode(index);
    removeDescription(index);
  }

  useEffect(() => {
    if (codeFields.length === 0) {
      addLine();
    }
  }, [codeFields, addLine]);

  const { errors } = methods.formState;
  console.log("errors", errors);
  return (
    <div className="fr-col">
      {codeFields.map(({ id }, index) => (
        <div
          className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom tw-relative"
          style={{
            alignItems: "flex-start"
          }}
          ref={containerRef}
          key={index}
        >
          <WasteCodeSelector
            methods={methods}
            key={id}
            name={`secondaryWasteCodes.${index}.value`}
            label="Code déchet secondaire (optionnel)"
            containerRef={containerRef}
          />
          <div className="fr-col-4">
            <Input
              label="Dénomination secondaire"
              key={descriptionFields[index].id}
              nativeInputProps={{
                type: "text",
                ...methods.register(`secondaryWasteDescriptions.${index}.value`)
              }}
              state={errors?.secondaryWasteDescriptions?.[index] && "error"}
              stateRelatedMessage={formatError(
                errors?.secondaryWasteDescriptions?.[index]?.value
              )}
            />
          </div>

          <div className="fr-col-2" style={{ paddingTop: "36px" }}>
            <Button
              className="fr-mr-1w"
              nativeButtonProps={{ type: "button" }}
              iconId="fr-icon-add-line"
              onClick={addLine}
              title="Label button"
            />
            <Button
              className="fr-mt-1w"
              nativeButtonProps={{ type: "button" }}
              iconId="fr-icon-delete-line"
              onClick={() => removeLine(index)}
              title="Label button"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
