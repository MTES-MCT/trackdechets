import React, { useEffect, useState } from "react";
import cn from "classnames";
import "./FrenchCompanySelector.scss";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { StatutDiffusionEtablissement } from "@td/codegen-ui";
import {
  InlineFrenchCompanySelector,
  type InlineFrenchCompanySelectorProps
} from "./FrenchCompanySelector";
import Input from "@codegouvfr/react-dsfr/Input";
import { formatError } from "../builder/error";
import { InlineAddress } from "./Address";
import { capitalize } from "../../../common/helper";

type BlockProps = Omit<InlineFrenchCompanySelectorProps, "title"> & {
  reducedMargin?: boolean;
  label: string;
  recepisseName?: string;
};

export function OptionalCompanySelector({
  prefix,
  methods,
  disabled,
  shortMode,
  reducedMargin,
  label,
  recepisseName,
  onCompanySelected
}: BlockProps) {
  const fieldName = shortMode ? `${prefix}Siret` : `${prefix}CompanyOrgId`;
  const selectedCompanyOrgId = methods.getValues(fieldName);
  const [isCompanyEnabled, setIsCompanyEnabled] = useState(
    selectedCompanyOrgId ? true : false
  );
  const companyStatusDiffusion: StatutDiffusionEtablissement | undefined =
    methods.watch(`${prefix}CompanyStatusDiffusion`);
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
      {label && <h5 className="fr-h5">{capitalize(label)}</h5>}
      <div>
        <div className={"fr-grid-row fr-grid-row--gutters"}>
          <div className={"fr-col-12"}>
            <ToggleSwitch
              label={`Présence d'un ${label}`}
              inputTitle={`Présence d'un ${label}`}
              showCheckedHint={false}
              checked={isCompanyEnabled}
              onChange={checked => setIsCompanyEnabled(checked)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      {isCompanyEnabled && (
        <InlineFrenchCompanySelector
          prefix={prefix}
          methods={methods}
          disabled={disabled}
          shortMode={shortMode}
          onCompanySelected={onCompanySelected}
        />
      )}
      {isCompanyEnabled && companyStatusDiffusion === "P" && (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-8">
            <Input
              label="Raison sociale"
              nativeInputProps={{
                type: "text",
                ...methods.register(
                  shortMode ? `${prefix}Name` : `${prefix}CompanyName`
                )
              }}
              state={
                errors?.[
                  shortMode ? `${prefix}Name` : `${prefix}CompanyName`
                ] && "error"
              }
              stateRelatedMessage={formatError(
                errors?.[shortMode ? `${prefix}Name` : `${prefix}CompanyName`]
              )}
            />
          </div>
        </div>
      )}
      {isCompanyEnabled && companyStatusDiffusion === "P" && !shortMode && (
        <InlineAddress prefix={`${prefix}Company`} methods={methods} />
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
