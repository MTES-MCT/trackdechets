import { FieldSwitch, RedErrorMessage } from "../../common/components";
import NumberInput from "../common/components/custom-inputs/NumberInput";
import { Field, useFormikContext } from "formik";
import { Bsff, BsffPackaging, BsffType } from "@td/codegen-ui";
import { BSFF_WASTES } from "@td/constants";
import React, { useEffect, useMemo } from "react";
import Packagings from "./components/packagings/Packagings";
import { PreviousPackagingsPicker } from "./components/PreviousPackagingsPicker";
import EstimatedQuantityTooltip from "../../common/components/EstimatedQuantityTooltip";

export default function WasteInfo({ disabled }) {
  const { setFieldValue, values } = useFormikContext<
    Bsff & { previousPackagings: BsffPackaging[] }
  >();

  const [hasPreviousPackagingsChanged, setHasPreviousPackagingsChanged] =
    React.useState(false);

  useEffect(() => {
    if ([BsffType.Reexpedition, BsffType.Groupement].includes(values.type)) {
      if (!values.id || hasPreviousPackagingsChanged) {
        setFieldValue(
          "packagings",
          values.previousPackagings.map(p => ({
            ...p,
            weight: p.acceptation?.weight ?? p.weight
          }))
        );
      }
    }
  }, [
    values.previousPackagings,
    values.type,
    values.id,
    hasPreviousPackagingsChanged,
    setFieldValue
  ]);

  // Compute the sum of packagings weight to prefill `weight.value`
  const totalWeight = useMemo(
    () =>
      values.packagings.reduce((acc, p) => {
        return acc + p.weight ?? 0;
      }, 0),
    [values.packagings]
  );

  useEffect(() => {
    setFieldValue("weight.value", totalWeight);
  }, [totalWeight, setFieldValue]);

  const ficheInterventionsWeight = useMemo(
    () => values.ficheInterventions?.reduce((w, FI) => w + FI.weight, 0),
    [values.ficheInterventions]
  );
  useEffect(() => {
    if ([BsffType.Groupement, BsffType.Reexpedition].includes(values.type)) {
      if (values.previousPackagings?.length && !values.waste?.code) {
        const wasteCode = values.previousPackagings[0].acceptation?.wasteCode;
        setFieldValue("waste.code", wasteCode ?? "");
      }
      if (!values.previousPackagings?.length && values.waste?.code) {
        setFieldValue("waste.code", "");
      }
    }
  }, [values.previousPackagings, values.type, setFieldValue, values.waste]);

  const wasteCodeDisabled = [
    BsffType.Groupement,
    BsffType.Reexpedition
  ].includes(values.type);

  return (
    <>
      {disabled && (
        <div className="notification notification--error">
          Les champs ci-dessous ont été scellés via signature et ne sont plus
          modifiables.
        </div>
      )}

      {[
        BsffType.Reconditionnement,
        BsffType.Groupement,
        BsffType.Reexpedition
      ].includes(values.type) && (
        <>
          <h4 className="form__section-heading">
            Contenants à{" "}
            {values.type === BsffType.Groupement
              ? "grouper"
              : values.type === BsffType.Reexpedition
              ? "reéxpédier"
              : "reconditionner"}
          </h4>
          <PreviousPackagingsPicker
            bsff={values}
            onAddOrRemove={() => setHasPreviousPackagingsChanged(true)}
          />
        </>
      )}

      <h4 className="form__section-heading">Déchet</h4>

      <div className="form__row">
        <label>
          Code déchet
          <Field
            as="select"
            name="waste.code"
            className="td-select"
            disabled={disabled || wasteCodeDisabled}
          >
            <option />
            {BSFF_WASTES.map(item => (
              <option value={item.code} key={item.code}>
                {item.code} - {item.description}
              </option>
            ))}
          </Field>
        </label>
        <RedErrorMessage name="waste.code" />
      </div>

      <div className="form__row">
        <label>
          Dénomination usuelle du déchet
          <Field
            type="text"
            name="waste.description"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <RedErrorMessage name="waste.description" />
      </div>

      <div className="form__row">
        <label>
          Mentions au titre des règlements ADR, RID, ADNR, IMDG
          <Field
            type="text"
            name="waste.adr"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <RedErrorMessage name="waste.adr" />
      </div>

      <h4 className="form__section-heading">
        {values.type === BsffType.Reconditionnement
          ? "Contenant de reconditionnement"
          : "Contenants"}
      </h4>

      <Field name="packagings" component={Packagings} disabled={disabled} />

      <h4 className="form__section-heading">Quantité</h4>

      {values.ficheInterventions?.length > 0 && (
        <div className="notification">
          Pour information, la somme des poids renseignés sur les fiches
          d'intervention est de {ficheInterventionsWeight} kg
        </div>
      )}

      <div className="form__row">
        <label>
          Quantité totale (en kg)
          <Field
            component={NumberInput}
            name="weight.value"
            disabled={disabled}
            className="td-input"
          />
        </label>
        <Field
          type="checkbox"
          label={
            <>
              Estimée <EstimatedQuantityTooltip />
            </>
          }
          component={FieldSwitch}
          name="weight.isEstimate"
          disabled={disabled}
        />
        <RedErrorMessage name="weight.value" />
      </div>
    </>
  );
}
