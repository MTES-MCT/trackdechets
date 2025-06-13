import React, { useEffect, useMemo } from "react";
import { formatError } from "../builder/error";
import Select from "@codegouvfr/react-dsfr/Select";
import { PROCESSING_OPERATIONS, FINAL_OPERATION_CODES } from "@td/constants";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Controller, UseFormReturn } from "react-hook-form";

type InlineProps = {
  methods: UseFormReturn<any>;
  operationCodes: string[];
  operationModes?: string[];
  disabled?: boolean;
  showNoTraceability?: boolean;
  showNextOperationCode?: boolean;
  isPlannedOperation?: boolean;
};

type Props = InlineProps & {
  title?: string;
};

const OPERATION_MODES = [
  { value: "REUTILISATION", label: "Réutilisation" },
  { value: "RECYCLAGE", label: "Recyclage" },
  {
    value: "VALORISATION_ENERGETIQUE",
    label: "Valorisation énergétique"
  },
  { value: "AUTRES_VALORISATIONS", label: "Autres valorisations" },
  { value: "ELIMINATION", label: "Élimination" }
];

export function Operation({
  methods,
  disabled,
  title,
  operationCodes,
  operationModes,
  showNoTraceability,
  showNextOperationCode,
  isPlannedOperation
}: Props) {
  return (
    <div className="fr-col">
      {title && <h5 className="fr-h5">{title}</h5>}
      <InlineOperation
        methods={methods}
        disabled={disabled}
        operationCodes={operationCodes}
        operationModes={operationModes}
        showNoTraceability={showNoTraceability}
        showNextOperationCode={showNextOperationCode}
        isPlannedOperation={isPlannedOperation}
      />
    </div>
  );
}

export function InlineOperation({
  methods,
  disabled,
  operationCodes,
  operationModes,
  showNoTraceability,
  showNextOperationCode,
  isPlannedOperation
}: InlineProps) {
  const { errors } = methods.formState;
  const selectedOperationCode = methods.watch("operationCode");

  const isFinalOperationCode = useMemo(
    () => FINAL_OPERATION_CODES.includes(selectedOperationCode),
    [selectedOperationCode]
  );

  const operations = useMemo(
    () =>
      operationCodes.map(code => ({
        label: `${code} - ${
          PROCESSING_OPERATIONS.find(operation => operation.code === code)
            ?.description
        }`,
        value: code
      })),
    [operationCodes]
  );

  const operationModesList = useMemo(() => {
    const possibleOperationModes = operationModes
      ? OPERATION_MODES.filter(mode => operationModes.includes(mode.value))
      : OPERATION_MODES;
    return selectedOperationCode && selectedOperationCode.startsWith("D")
      ? possibleOperationModes.filter(mode => mode.value === "ELIMINATION")
      : possibleOperationModes.filter(mode => mode.value !== "ELIMINATION");
  }, [selectedOperationCode, operationModes]);

  useEffect(() => {
    if (selectedOperationCode && selectedOperationCode.startsWith("D")) {
      methods.setValue("operationMode", "ELIMINATION");
    }
    if (selectedOperationCode && isFinalOperationCode) {
      if (showNoTraceability) {
        methods.setValue("noTraceability", false);
      }
      if (showNextOperationCode) {
        methods.setValue("nextOperationCode", "");
      }
    } else if (selectedOperationCode && !isFinalOperationCode) {
      methods.setValue("operationMode", "");
    }
  }, [
    selectedOperationCode,
    isFinalOperationCode,
    showNoTraceability,
    showNextOperationCode,
    methods
  ]);

  return (
    <>
      <div
        className={
          showNoTraceability || showNextOperationCode ? "fr-mb-2w" : ""
        }
      >
        <div className={"fr-grid-row fr-grid-row--gutters"}>
          <div className={"fr-col-4"} key={"operationCode"}>
            <Select
              label={
                isPlannedOperation
                  ? "Code de traitement prévu"
                  : "Code de traitement réalisé"
              }
              nativeSelectProps={{
                ...methods.register("operationCode"),
                defaultValue: ""
              }}
              disabled={disabled}
              state={errors?.operationCode && "error"}
              stateRelatedMessage={formatError(errors?.operationCode)}
            >
              <option value={""} disabled hidden>
                {"Sélectionnez un traitement"}
              </option>
              {operations.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className={"fr-col-4"}>
            <Select
              label={
                isPlannedOperation
                  ? "Mode de traitement prévu (optionnel)"
                  : "Mode de traitement réalisé"
              }
              nativeSelectProps={{
                ...methods.register("operationMode"),
                defaultValue: ""
              }}
              disabled={
                disabled || (selectedOperationCode && !isFinalOperationCode)
              }
              state={errors?.operationMode && "error"}
              stateRelatedMessage={formatError(errors?.operationMode)}
            >
              <option
                value={""}
                disabled={isFinalOperationCode && selectedOperationCode}
                hidden={isFinalOperationCode && selectedOperationCode}
              >
                {"Sélectionnez un mode"}
              </option>
              {operationModesList.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      {showNoTraceability && (
        <div className={showNextOperationCode ? "fr-mb-2w" : ""}>
          <div className={"fr-grid-row fr-grid-row--gutters"}>
            <div className={"fr-col-12"}>
              <Controller
                name={"noTraceability"}
                control={methods.control}
                render={({ field: controllerField }) => (
                  <ToggleSwitch
                    label={"Rupture de traçabilité autorisée"}
                    inputTitle={"noTraceability"}
                    showCheckedHint={false}
                    checked={controllerField.value}
                    onChange={checked => controllerField.onChange(checked)}
                    disabled={disabled || isFinalOperationCode}
                  />
                )}
              />
              {errors?.noTraceability && (
                <Alert
                  className="fr-mt-2w"
                  description={formatError(errors?.noTraceability)}
                  severity="error"
                  small
                />
              )}
            </div>
          </div>
        </div>
      )}
      {showNextOperationCode && (
        <div className={"fr-grid-row fr-grid-row--gutters"}>
          <div className={"fr-col-4"} key={"nextOperationCode"}>
            <Select
              label={"Code de traitement ultérieur prévu"}
              nativeSelectProps={{
                ...methods.register("nextOperationCode"),
                defaultValue: ""
              }}
              disabled={disabled || isFinalOperationCode}
              state={errors?.nextOperationCode && "error"}
              stateRelatedMessage={formatError(errors?.nextOperationCode)}
            >
              <option value={""} disabled hidden>
                {"Sélectionnez un traitement"}
              </option>
              {operations.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </>
  );
}
