import React, { useContext } from "react";
import { RenderPackagingFormProps } from "./BsffPackagingList";
import { useFormContext } from "react-hook-form";
import { BsffPackagingType, BsffType, Packagings } from "@td/codegen-ui";
import { SealedFieldsContext } from "../../context";
import { hasInitialValue } from "../utils/initial-detenteurs";
import BsffPackagingForm from "./BsffPackagingForm";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec React Hook Form
 */
function RhfBsffPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  packagingTypes,
  idx,
  disabled = false,
  volumeEditable = false,
  detenteurMode = false,
  operateurMode = false
}: RenderPackagingFormProps & {
  volumeEditable?: boolean;
  detenteurMode?: boolean;
  operateurMode?: boolean;
}) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const {
    register,
    getFieldState,
    formState,
    setValue,
    resetField,
    watch,
    getValues
  } = useFormContext();
  const isGrouping = watch("type") === BsffType.Groupement;
  const sources = watch("grouping") ?? [];
  const source =
    sources.find(container => container.id === getValues(fieldPath("id"))) ??
    sources.find(container => container.numero === packaging.numero);
  const sealed = useContext(SealedFieldsContext);
  const groupingSealed =
    sealed.includes("packagings") || sealed.includes("grouping");
  const initialFieldPresent = (field: string) =>
    isGrouping &&
    hasInitialValue(
      field === "weight"
        ? source?.acceptation?.weight ?? source?.weight
        : source?.[field]
    );

  const { error: errorVolume, isTouched: isTouchedVolume } = getFieldState(
    fieldPath("volume")
  );

  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );

  const { error: errorWeight, isTouched: isTouchedWeight } = getFieldState(
    fieldPath("weight")
  );
  const { error: errorOther, isTouched: isTouchedOther } = getFieldState(
    fieldPath("other")
  );

  const { error: errorNumero, isTouched: isTouchedNumero } = getFieldState(
    fieldPath("numero")
  );

  const errors = {
    type: errorType?.message,
    volume: errorVolume?.message,
    weight: errorWeight?.message,
    numero: errorNumero?.message,
    other: errorOther?.message
  };

  // Affiche les erreurs uniquement une première
  // tentative d'envoi du formulaire
  const hasBeenSubmitted = formState.submitCount > 0;

  const touched = {
    type: isTouchedType && hasBeenSubmitted,
    volume: isTouchedVolume && hasBeenSubmitted,
    weight: isTouchedWeight && hasBeenSubmitted,
    numero: isTouchedNumero && hasBeenSubmitted,
    other: isTouchedOther && hasBeenSubmitted
  };

  const packagingType = packaging.type;

  return (
    <BsffPackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      packagingTypes={packagingTypes}
      volumeEditable={volumeEditable}
      detenteurMode={detenteurMode}
      operateurMode={operateurMode}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: {
          disabled: isGrouping
            ? groupingSealed || initialFieldPresent("type")
            : disabled,
          value: packagingType,
          ...register(fieldPath("type"), {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (
                event.target.value === Packagings.Autre ||
                event.target.value === BsffPackagingType.Autre
              ) {
                setValue(fieldPath("other"), "", {
                  shouldTouch: true,
                  shouldDirty: true
                });
              } else {
                resetField(fieldPath("other"));
                setValue(fieldPath("other"), null);
              }
            }
          })
        },
        volume: {
          ...register(fieldPath("volume")),
          disabled: isGrouping
            ? groupingSealed
            : volumeEditable
            ? false
            : disabled,
          readOnly: initialFieldPresent("volume")
        },
        weight: {
          ...register(fieldPath("weight")),
          disabled: isGrouping ? groupingSealed : disabled,
          readOnly: initialFieldPresent("weight")
        },
        other: {
          ...register(fieldPath("other")),
          disabled: isGrouping ? groupingSealed : disabled,
          readOnly: initialFieldPresent("other")
        },
        numero: {
          ...register(fieldPath("numero")),
          disabled: isGrouping ? groupingSealed : disabled,
          readOnly: initialFieldPresent("numero")
        }
      }}
    />
  );
}

export default RhfBsffPackagingForm;
