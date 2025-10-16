import React, { useCallback, useEffect, useRef } from "react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { formatError } from "../builder/error";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { ALL_WASTES } from "@td/constants";
import { capitalize } from "../../../common/helper";
import { useMedia } from "../../../common/use-media";
import { MEDIA_QUERIES } from "../../../common/config";

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
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  return (
    <div className="fr-col">
      {codeFields.map(({ id }, index) => {
        const description = ALL_WASTES.find(
          waste =>
            waste.code ===
            methods.getValues(`secondaryWasteCodes.${index}.value`)
        )?.description;
        return (
          <div
            className="fr-grid-row fr-grid-row--gutters fr-grid-row--top fr-mt-2w"
            ref={containerRef}
            key={index}
          >
            <div
              className={
                !isMobile
                  ? "fr-grid-row fr-grid-row--gutters fr-grid-row--top"
                  : ""
              }
              style={
                isMobile
                  ? {
                      position: "relative",
                      padding: "0 .5rem",
                      width: "100%"
                    }
                  : { padding: ".5rem" }
              }
            >
              <WasteCodeSelector
                methods={methods}
                key={id}
                name={`secondaryWasteCodes.${index}.value`}
                label="Code déchet secondaire (optionnel)"
                containerRef={containerRef}
                displayDescription={false}
              />
            </div>
            <div
              className="fr-grid-row fr-grid-row--bottom fr-mt-2w"
              style={
                isMobile
                  ? {
                      padding: " .5rem",
                      width: "100%"
                    }
                  : { width: "45%" }
              }
            >
              <div className="fr-col-7 fr-col-md-8">
                <Input
                  label="Dénomination secondaire"
                  key={descriptionFields[index].id}
                  nativeInputProps={{
                    type: "text",
                    ...methods.register(
                      `secondaryWasteDescriptions.${index}.value`
                    )
                  }}
                  state={errors?.secondaryWasteDescriptions?.[index] && "error"}
                  stateRelatedMessage={formatError(
                    errors?.secondaryWasteDescriptions?.[index]?.value
                  )}
                />
              </div>
              <div className="fr-col-md-4">
                <Button
                  className="fr-ml-4w"
                  nativeButtonProps={{ type: "button" }}
                  iconId="fr-icon-add-line"
                  onClick={addLine}
                  title="Label button"
                />
                <Button
                  className="fr-mt-1w"
                  style={{ marginLeft: "3px" }}
                  nativeButtonProps={{ type: "button" }}
                  iconId="fr-icon-delete-line"
                  onClick={() => removeLine(index)}
                  title="Label button"
                />
              </div>
            </div>
            {description && (
              <div className="fr-col-md-12">
                <Alert
                  description={capitalize(description) as string}
                  severity="info"
                  small
                />
              </div>
            )}
          </div>
        );
      })}
      {errors?.secondaryWasteCodes &&
        !Array.isArray(errors?.secondaryWasteCodes) && (
          <div className="fr-col-md-12 fr-mt-2w">
            <Alert
              description={formatError(errors.secondaryWasteCodes)}
              severity="error"
              small
            />
          </div>
        )}
    </div>
  );
}
