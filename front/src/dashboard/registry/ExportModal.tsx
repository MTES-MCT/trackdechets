import React from "react";
import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  RegistryExportFormat,
  RegistryV2ExportWasteType,
  RegistryV2ExportType
} from "@td/codegen-ui";

import { FieldError } from "react-hook-form";
import { datetimeToYYYYMMDD } from "../../Apps/Dashboard/Validation/BSPaoh/paohUtils";
import { format, getYear, startOfYear, endOfYear, subYears } from "date-fns";
import { Modal } from "../../common/components";
import Button from "@codegouvfr/react-dsfr/Button";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import classNames from "classnames";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { WasteCodeSwitcher } from "./WasteCodeSwitcher";
import { RegistryCompanySwitcher } from "./RegistryCompanySwitcher";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { getDeclarationTypeWording, getRegistryTypeWording } from "./MyExports";
import { useRegistryExportModal } from "./RegistryV2ExportModalContext";

const displayError = (error: FieldError | undefined) => {
  return error ? error.message : null;
};

const getFilterStateForRegistryType = (
  registryType: RegistryV2ExportType,
  filterName: string
): {
  disabled: boolean;
} => {
  if (registryType === RegistryV2ExportType.Ssd) {
    if (filterName.startsWith("wasteTypes")) {
      return {
        disabled: true
      };
    } else if (filterName === "declarationType") {
      return {
        disabled: true
      };
    }
  }
  return {
    disabled: false
  };
};

const getDateButtons = () => {
  const currentYear = getYear(new Date());
  return [
    {
      label: "Année courante",
      startDate: format(startOfYear(new Date()), "yyyy-MM-dd")
    },
    {
      label: `${currentYear - 3}`,
      startDate: format(startOfYear(subYears(new Date(), 3)), "yyyy-MM-dd"),
      endDate: format(endOfYear(subYears(new Date(), 3)), "yyyy-MM-dd")
    },
    {
      label: `${currentYear - 2}`,
      startDate: format(startOfYear(subYears(new Date(), 2)), "yyyy-MM-dd"),
      endDate: format(endOfYear(subYears(new Date(), 2)), "yyyy-MM-dd")
    },
    {
      label: `${currentYear - 1}`,
      startDate: format(startOfYear(subYears(new Date(), 1)), "yyyy-MM-dd"),
      endDate: format(endOfYear(subYears(new Date(), 1)), "yyyy-MM-dd")
    }
  ];
};

const getDateDescription = (
  registryType: RegistryV2ExportType | null
): string => {
  switch (registryType) {
    case RegistryV2ExportType.Ssd:
      return "La date d'utilisation ou d'expédition est prise en compte.";
    case RegistryV2ExportType.Incoming:
      return "La date de réception est prise en compte.";
    case RegistryV2ExportType.Outgoing:
    case RegistryV2ExportType.Transported:
    case RegistryV2ExportType.Managed:
      return "La date d'expédition est prise en compte. ";
    default:
      return "La date de dernière mise à jour du bordereau est prise en compte.";
  }
};

export function ExportModal() {
  const {
    type,
    isOpen,
    onClose,
    isLoading,
    companiesError,
    error,
    methods,
    submit,
    registryDelegationsData,
    registryDelegationsLoading,
    possibleExportTypes
  } = useRegistryExportModal();
  const {
    register,
    formState: { errors },
    setValue,
    watch
  } = methods;
  const dateButtons = getDateButtons();
  const isDelegation = type === "registryV2" ? watch("isDelegation") : false;
  const registryType = type === "registryV2" ? watch("registryType") : null;
  const startDate = watch("startDate");
  return (
    <Modal
      title="Exporter"
      ariaLabel="Exporter un registre"
      onClose={onClose}
      closeLabel="Annuler"
      isOpen={isOpen}
      size="M"
    >
      {companiesError ? (
        <InlineError apolloError={companiesError} />
      ) : (
        <form onSubmit={submit}>
          <div className="fr-mb-8v">
            <RegistryCompanySwitcher
              onCompanySelect={(orgId, isDelegation) => {
                setValue("companyOrgId", orgId);
                setValue("isDelegation", isDelegation);
                setValue("delegateSiret", null);
              }}
              wrapperClassName={"tw-relative"}
              allOption={{
                key: "all",
                name: "Tous les établissements"
              }}
            />
            {type === "registryV2" && isDelegation ? (
              registryDelegationsLoading ? (
                <div className="fr-mt-2v">
                  <InlineLoader size={32} />
                </div>
              ) : registryDelegationsData?.registryDelegations.edges.length ? (
                <div className="fr-mt-2v">
                  {registryDelegationsData.registryDelegations.edges.length ===
                  1 ? (
                    <p className={styles.delegationHint}>
                      {`L'export ne comprendra que les données déclarées en tant que délégataire pour l'établissement :\n`}
                      <br />
                      <b>
                        {`${
                          registryDelegationsData.registryDelegations.edges[0]
                            .node.delegate.givenName ||
                          registryDelegationsData.registryDelegations.edges[0]
                            .node.delegate.name ||
                          ""
                        } ${
                          registryDelegationsData.registryDelegations.edges[0]
                            .node.delegate.orgId || ""
                        }`}
                      </b>
                    </p>
                  ) : (
                    <>
                      <p className={styles.delegationHint}>
                        L'export ne comprendra que les données déclarées en tant
                        que délégataire pour l'établissement à choisir
                        ci-dessous
                      </p>
                      <div className="fr-mt-4v">
                        <Select
                          label="Établissement délégataire"
                          disabled={isLoading}
                          nativeSelectProps={{
                            ...register("delegateSiret")
                          }}
                        >
                          {registryDelegationsData.registryDelegations.edges.map(
                            edge => (
                              <option
                                value={edge.node.delegate.orgId}
                                key={edge.node.delegate.orgId}
                              >
                                {`${
                                  edge.node.delegate.givenName ||
                                  edge.node.delegate.name ||
                                  ""
                                } ${edge.node.delegate.orgId || ""}`}
                              </option>
                            )
                          )}
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              ) : null
            ) : null}
          </div>
          {type === "registryV2" && (
            <>
              <div className="fr-mb-8v">
                <Select
                  label="Type de registre"
                  disabled={isLoading}
                  nativeSelectProps={{
                    ...register("registryType")
                  }}
                >
                  {[
                    RegistryV2ExportType.Incoming,
                    RegistryV2ExportType.Outgoing,
                    RegistryV2ExportType.Transported,
                    RegistryV2ExportType.Managed,
                    RegistryV2ExportType.Ssd
                  ].map(key => (
                    <option
                      value={key}
                      key={key}
                      disabled={!possibleExportTypes.includes(key)}
                    >
                      {getRegistryTypeWording(key)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="fr-container--fluid fr-mb-8v">
                <Select
                  label="Type de déclaration"
                  disabled={
                    isLoading ||
                    getFilterStateForRegistryType(
                      registryType as RegistryV2ExportType,
                      "declarationType"
                    ).disabled
                  }
                  nativeSelectProps={{
                    ...register("declarationType")
                  }}
                >
                  {Object.keys(DeclarationType).map(key => (
                    <option
                      value={DeclarationType[key]}
                      key={DeclarationType[key]}
                    >
                      {getDeclarationTypeWording(DeclarationType[key])}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="fr-container--fluid">
                <Checkbox
                  hintText="Sélectionner au moins un type de déchets"
                  legend="Type de déchets"
                  disabled={isLoading}
                  options={[
                    {
                      label: "Déchets non dangereux",
                      nativeInputProps: {
                        value: RegistryV2ExportWasteType.Dnd,
                        disabled: getFilterStateForRegistryType(
                          registryType as RegistryV2ExportType,
                          "wasteTypes.dnd"
                        ).disabled,
                        ...register("wasteTypes")
                      }
                    },
                    {
                      label: "Déchets dangereux",
                      nativeInputProps: {
                        value: RegistryV2ExportWasteType.Dd,
                        disabled: getFilterStateForRegistryType(
                          registryType as RegistryV2ExportType,
                          "wasteTypes.dd"
                        ).disabled,
                        ...register("wasteTypes")
                      }
                    },
                    {
                      label: "Terres et sédiments",
                      nativeInputProps: {
                        value: RegistryV2ExportWasteType.Texs,
                        disabled: getFilterStateForRegistryType(
                          registryType as RegistryV2ExportType,
                          "wasteTypes.texs"
                        ).disabled,
                        ...register("wasteTypes")
                      }
                    }
                  ]}
                />
              </div>
              <div className="fr-mb-8v">
                <WasteCodeSwitcher
                  id={"wasteCodeSwitcher"}
                  onSelectChange={wasteCodes => {
                    setValue(
                      "wasteCodes",
                      wasteCodes.map(({ code }) => code)
                    );
                  }}
                />
              </div>
            </>
          )}
          <h6 className="fr-h6">{`Période concernée`}</h6>
          <div className={classNames(["fr-mb-8v", styles.dateButtons])}>
            {dateButtons.map((dateButton, key) => (
              <Button
                onClick={() => {
                  setValue("startDate", dateButton.startDate);
                  if (dateButton.endDate) {
                    setValue("endDate", dateButton.endDate);
                  } else {
                    setValue("endDate", null);
                  }
                }}
                disabled={isLoading}
                type="button"
                priority="tertiary"
                key={key}
              >
                {dateButton.label}
              </Button>
            ))}
          </div>
          <div className="fr-container--fluid fr-mb-2v">
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
              <div className="fr-col-6">
                <Input
                  label="Date de début"
                  hintText="Format: jj/mm/aaaa"
                  state={errors?.startDate && "error"}
                  stateRelatedMessage={displayError(errors?.startDate)}
                  disabled={isLoading}
                  nativeInputProps={{
                    type: "date",
                    max: datetimeToYYYYMMDD(new Date()),
                    ...register("startDate")
                  }}
                />
              </div>
              <div className="fr-col-6">
                <Input
                  label="Date de fin (optionnelle)"
                  hintText="Format: jj/mm/aaaa"
                  state={errors?.endDate && "error"}
                  stateRelatedMessage={displayError(errors?.endDate)}
                  disabled={isLoading}
                  nativeInputProps={{
                    type: "date",
                    min: startDate,
                    max: datetimeToYYYYMMDD(new Date()),
                    ...register("endDate")
                  }}
                />
              </div>
            </div>
          </div>
          <div className="fr-mb-8v">
            <Alert
              description={getDateDescription(registryType)}
              severity="info"
              small
            />
          </div>
          <div className="fr-container--fluid fr-mb-8v">
            <Select
              label="Format d'export"
              disabled={isLoading}
              nativeSelectProps={{
                ...register("format")
              }}
            >
              <option
                value={RegistryExportFormat.Csv}
                key={RegistryExportFormat.Csv}
              >
                {`Texte (.csv)`}
              </option>
              <option
                value={RegistryExportFormat.Xlsx}
                key={RegistryExportFormat.Xlsx}
              >
                {`Excel (.xlsx)`}
              </option>
            </Select>
          </div>
          {error && (
            <Alert
              className="fr-mb-3w"
              small
              description={error}
              severity="error"
            />
          )}
        </form>
      )}
      <div className="td-modal-actions">
        <Button priority="secondary" disabled={isLoading} onClick={onClose}>
          Annuler
        </Button>
        <Button
          priority="primary"
          iconId="fr-icon-download-line"
          iconPosition="right"
          disabled={isLoading}
          onClick={submit}
        >
          Exporter
        </Button>
      </div>
    </Modal>
  );
}
