import React, { useEffect, useState } from "react";
import cn from "classnames";
import "./FrenchCompanySelector.scss";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  InlineFrenchCompanySelector,
  type InlineFrenchCompanySelectorProps
} from "./FrenchCompanySelector";
import Input from "@codegouvfr/react-dsfr/Input";
import { formatError } from "../builder/error";

type BlockProps = InlineFrenchCompanySelectorProps & {
  reducedMargin?: boolean;
  toggleLabel?: string;
  recepisseName?: string;
};

export function OptionalCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  reducedMargin,
  title,
  toggleLabel,
  recepisseName,
  onCompanySelected
}: BlockProps) {
  const fieldName = shortMode ? `${prefix}Siret` : `${prefix}CompanyOrgId`;
  const selectedCompanyOrgId = methods.getValues(fieldName);
  const [isCompanyEnabled, setIsCompanyEnabled] = useState(
    toggleLabel ? (selectedCompanyOrgId ? true : false) : true
  );
  const { errors } = methods.formState;
  const recepisseError = recepisseName ? errors?.[recepisseName] : undefined;
  useEffect(() => {
    if (!isCompanyEnabled) {
      if (shortMode) {
        methods.setValue(`${prefix}Siret`, "");
        methods.setValue(`${prefix}Name`, "");
      } else {
        methods.setValue(`${prefix}CompanyOrgId`, "");
        methods.setValue(`${prefix}CompanyName`, "");
        methods.setValue(`${prefix}CompanyAddress`, "");
        methods.setValue(`${prefix}CompanyCity`, "");
        methods.setValue(`${prefix}CompanyPostalCode`, "");
        methods.setValue(`${prefix}CompanyCountryCode`, "FR");
      }
    }
  }, [prefix, shortMode, isCompanyEnabled, methods]);

  return (
    <div
      className={cn("fr-col", {
        "company-selector-reduced-margin": reducedMargin
      })}
    >
      {title && <h5 className="fr-h5">{title}</h5>}
      {toggleLabel && (
        <div>
          <div className={"fr-grid-row fr-grid-row--gutters"}>
            <div className={"fr-col-12"}>
              <ToggleSwitch
                label={toggleLabel}
                inputTitle={toggleLabel}
                showCheckedHint={false}
                checked={isCompanyEnabled}
                onChange={checked => setIsCompanyEnabled(checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
      {isCompanyEnabled && (
        <InlineFrenchCompanySelector
          prefix={prefix}
          methods={methods}
          disabled={disabled}
          shortMode={shortMode}
          onCompanySelected={onCompanySelected}
        />
      )}
      {recepisseName && isCompanyEnabled && (
        <div className={"fr-grid-row fr-grid-row--gutters fr-mb-2w"}>
          <div className={"fr-col-8"}>
            <Input
              label={"Numéro de récépissé"}
              disabled={disabled}
              nativeInputProps={{
                type: "text",
                ...methods.register(recepisseName)
              }}
              state={recepisseError && "error"}
              stateRelatedMessage={formatError(recepisseError)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
