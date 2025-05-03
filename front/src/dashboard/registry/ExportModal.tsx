import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery } from "@apollo/client";
import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  FormsRegisterExportFormat,
  Mutation,
  MutationGenerateRegistryV2ExportArgs,
  Query,
  RegistryV2ExportWasteType,
  RegistryV2ExportType,
  CompanyType
} from "@td/codegen-ui";
import {
  GENERATE_REGISTRY_V2_EXPORT,
  GET_MY_COMPANIES,
  GET_REGISTRY_V2_EXPORTS
} from "./shared";
import { FieldError, useForm } from "react-hook-form";
import { datetimeToYYYYMMDD } from "../../Apps/Dashboard/Validation/BSPaoh/paohUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  format,
  getYear,
  startOfYear,
  endOfYear,
  subYears,
  endOfDay,
  startOfDay
} from "date-fns";
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
import { REGISTRY_DELEGATIONS } from "../../Apps/common/queries/registryDelegation/queries";

type Props = { isOpen: boolean; onClose: () => void };

const displayError = (error: FieldError | undefined) => {
  return error ? error.message : null;
};

const getRegistryTypeWording = (registryType: RegistryV2ExportType): string => {
  switch (registryType) {
    case RegistryV2ExportType.Ssd:
      return `Sortie de statut de déchet`;
    case RegistryV2ExportType.Incoming:
      return `Registre entrant`;
    case RegistryV2ExportType.Managed:
      return `Registre géré`;
    case RegistryV2ExportType.Outgoing:
      return `Registre sortant`;
    case RegistryV2ExportType.Transported:
      return `Registre transporté`;
    case RegistryV2ExportType.All:
      return `Registre exhaustif`;
    default:
      return `Registre exhaustif`;
  }
};

const getDeclarationTypeWording = (
  declarationType: DeclarationType
): string => {
  switch (declarationType) {
    case DeclarationType.All:
      return `Tous`;
    case DeclarationType.Bsd:
      return `Tracé (bordereaux)`;
    case DeclarationType.Registry:
      return `Déclaré (registre national)`;
    default:
      return `Tous`;
  }
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
  } else if (registryType === RegistryV2ExportType.All) {
    if (filterName === "wasteTypes.dnd") {
      return {
        disabled: false
      };
    } else if (filterName === "wasteTypes.dd") {
      return {
        disabled: false
      };
    } else if (filterName === "wasteTypes.texs") {
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

const getDefaultsForRegistryType = (
  registryType: RegistryV2ExportType
): {
  wasteTypes?: [RegistryV2ExportWasteType, ...RegistryV2ExportWasteType[]];
  declarationType?: DeclarationType;
} => {
  if (registryType === RegistryV2ExportType.Ssd) {
    return {
      wasteTypes: [
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Texs
      ],
      declarationType: DeclarationType.Registry
    };
  } else if (registryType === RegistryV2ExportType.Incoming) {
    return {
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Managed) {
    return {
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Outgoing) {
    return {
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Transported) {
    return {
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.All) {
    return {
      wasteTypes: [RegistryV2ExportWasteType.Dnd, RegistryV2ExportWasteType.Dd],
      declarationType: DeclarationType.Bsd
    };
  }
  return {
    wasteTypes: [
      RegistryV2ExportWasteType.Dnd,
      RegistryV2ExportWasteType.Dd,
      RegistryV2ExportWasteType.Texs
    ],
    declarationType: DeclarationType.Registry
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

const getSchema = () =>
  z
    .object({
      companyOrgId: z.string({ required_error: "Ce champ est requis" }),
      isDelegation: z.boolean(),
      delegateSiret: z.string().nullable(),
      startDate: z.coerce
        .date({
          required_error: "La date de début est requise",
          invalid_type_error: "La date de début est invalide"
        })
        .max(new Date(), {
          message: "La date de début ne peut pas être dans le futur"
        })
        .transform(val => val.toISOString()),
      // Date & "" hack: https://github.com/colinhacks/zod/issues/1721
      endDate: z.preprocess(
        arg => (arg === "" ? null : arg),
        z.coerce
          .date({
            invalid_type_error: "La date de fin est invalide"
          })
          .max(new Date(), {
            message: "La date de fin ne peut pas être dans le futur"
          })
          .transform(val => {
            if (val) return val.toISOString();
            return val;
          })
          .nullish()
      ),
      registryType: z.nativeEnum(RegistryV2ExportType),
      format: z.nativeEnum(FormsRegisterExportFormat),
      declarationType: z.nativeEnum(DeclarationType),
      wasteTypes: z.nativeEnum(RegistryV2ExportWasteType).array().nonempty({
        message: "Veullez sélectionner au moins un type de déchet"
      }),
      wasteCodes: z.string().array()
    })
    .superRefine(({ startDate, endDate }, ctx) => {
      if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["startDate"],
            message: "La date de début doit être avant la date de fin."
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "La date de début doit être avant la date de fin."
          });
        }
      }
    });

const getDefaultValues = () => ({
  companyOrgId: "all",
  isDelegation: false,
  delegateSiret: null,
  startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
  registryType: RegistryV2ExportType.Incoming,
  format: FormsRegisterExportFormat.Csv,
  declarationType: DeclarationType.All,
  wasteTypes: [
    RegistryV2ExportWasteType.Dd,
    RegistryV2ExportWasteType.Dnd,
    RegistryV2ExportWasteType.Texs
  ],
  wasteCodes: []
});

const getDateDescription = (registryType: RegistryV2ExportType): string => {
  switch (registryType) {
    case RegistryV2ExportType.Ssd:
      return "La date d'utilisation ou d'expédition est prise en compte.";
    case RegistryV2ExportType.Incoming:
      return "La date de réception est prise en compte.";
    case RegistryV2ExportType.Outgoing:
    case RegistryV2ExportType.Transported:
    case RegistryV2ExportType.Managed:
      return "La date d'expédition est prise en compte. ";
  }
  return "";
};

export function ExportModal({ isOpen, onClose }: Props) {
  // const [companies, setCompanies] = useState<ExportCompany[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [generateExport, { loading: generateLoading }] = useMutation<
    Pick<Mutation, "generateRegistryV2Export">,
    Omit<MutationGenerateRegistryV2ExportArgs, "where"> & {
      declarationType: DeclarationType;
      wasteTypes: RegistryV2ExportWasteType[] | null;
      wasteCodes: string[] | null;
    }
  >(GENERATE_REGISTRY_V2_EXPORT, {
    refetchQueries: [GET_REGISTRY_V2_EXPORTS]
  });

  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: getDefaultValues(),
    resolver: zodResolver(validationSchema)
  });

  const companyOrgId = watch("companyOrgId");
  const isDelegation = watch("isDelegation");
  const registryType = watch("registryType");
  const startDate = watch("startDate");

  const {
    data: registryDelegationsData,
    loading: registryDelegationsLoading,
    error: registryDelegationsError
  } = useQuery<Pick<Query, "registryDelegations">>(REGISTRY_DELEGATIONS, {
    variables: {
      where: {
        delegatorOrgId: companyOrgId,
        givenToMe: true,
        activeOnly: true
      }
    },
    skip: !isDelegation,
    fetchPolicy: "network-only"
  });

  const { data: companiesData, error: companiesError } = useQuery<
    Pick<Query, "myCompanies">
  >(GET_MY_COMPANIES, {
    variables: {
      search: companyOrgId
    },
    skip: isDelegation,
    fetchPolicy: "network-only"
  });

  const closeAndReset = () => {
    setError(null);
    reset(getDefaultValues());
    onClose();
  };

  // get a list of possible export types for the selected company (or all companies) to grey out
  // the export types that are impossible
  const possibleExportTypes = useMemo(() => {
    if (companyOrgId === "all") {
      return [
        RegistryV2ExportType.Outgoing,
        RegistryV2ExportType.Incoming,
        RegistryV2ExportType.Transported,
        RegistryV2ExportType.Managed,
        RegistryV2ExportType.Ssd
      ];
    }
    const companies = isDelegation
      ? registryDelegationsData?.registryDelegations.edges.map(
          d => d.node.delegator
        )
      : companiesData?.myCompanies.edges.map(c => c.node);
    const selectedCompany = companies?.find(c => c.orgId === companyOrgId);
    if (!selectedCompany) {
      return [
        RegistryV2ExportType.Outgoing,
        RegistryV2ExportType.Incoming,
        RegistryV2ExportType.Transported,
        RegistryV2ExportType.Managed,
        RegistryV2ExportType.Ssd
      ];
    }
    const companyTypes = selectedCompany.companyTypes;

    const exportTypes: RegistryV2ExportType[] = [];

    if (
      companyTypes.filter(t =>
        [
          CompanyType.Producer,
          CompanyType.WasteVehicles,
          CompanyType.WasteCenter,
          CompanyType.Collector,
          CompanyType.Worker,
          CompanyType.EcoOrganisme
        ].includes(t)
      ).length > 0
    ) {
      exportTypes.push(RegistryV2ExportType.Outgoing);
    }

    if (
      companyTypes.filter(t =>
        [
          CompanyType.Wasteprocessor,
          CompanyType.WasteVehicles,
          CompanyType.Collector
        ].includes(t)
      ).length > 0
    ) {
      exportTypes.push(RegistryV2ExportType.Incoming);
    }

    if (companyTypes.includes(CompanyType.Transporter)) {
      exportTypes.push(RegistryV2ExportType.Transported);
    }

    if (
      companyTypes.includes(CompanyType.Trader) ||
      companyTypes.includes(CompanyType.Broker) ||
      companyTypes.includes(CompanyType.Intermediary)
    ) {
      exportTypes.push(RegistryV2ExportType.Managed);
    }
    exportTypes.push(RegistryV2ExportType.Ssd);
    return exportTypes;
  }, [companyOrgId, isDelegation, companiesData, registryDelegationsData]);

  // if the registry type is not in the possible export types, set the first possible export type
  useEffect(() => {
    if (!possibleExportTypes.includes(registryType)) {
      setValue("registryType", possibleExportTypes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [possibleExportTypes, registryType]);

  // set the default values for waste types and declaration type depending on the registry type
  useEffect(() => {
    const defaults = getDefaultsForRegistryType(registryType);
    if (defaults) {
      if (defaults.wasteTypes) {
        setValue("wasteTypes", defaults.wasteTypes);
      }
      if (defaults.declarationType) {
        setValue("declarationType", defaults.declarationType);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryType]);

  const onSubmit = async (input: z.infer<typeof validationSchema>) => {
    setError(null);
    const {
      companyOrgId,
      isDelegation,
      registryType,
      format,
      startDate,
      endDate,
      declarationType,
      wasteTypes,
      wasteCodes
    } = input;
    let delegateSiret = input.delegateSiret;
    if (isDelegation) {
      if (!delegateSiret) {
        if (registryDelegationsData?.registryDelegations.edges.length === 1) {
          const tmpSiret =
            registryDelegationsData.registryDelegations.edges[0].node.delegate
              .siret;
          if (tmpSiret) {
            delegateSiret = tmpSiret;
          }
        } else {
          setError("Veuillez sélectionner un délégataire");
          return;
        }
      }
    }
    const siret = companyOrgId === "all" ? null : companyOrgId;
    // push the dates to the extremities of days so we include the days entered in the inputs
    const startOfDayStartDate = startOfDay(new Date(startDate)).toISOString();
    const endOfDayEndDate = endDate
      ? endOfDay(new Date(endDate)).toISOString()
      : null;

    if (
      registryType !== RegistryV2ExportType.Ssd &&
      registryType !== RegistryV2ExportType.Incoming &&
      registryType !== RegistryV2ExportType.Outgoing &&
      registryType !== RegistryV2ExportType.Transported &&
      registryType !== RegistryV2ExportType.Managed
    ) {
      setError(
        "Seuls les exports SSD, entrants, sortants, transportés et gérés sont supportés pour le moment"
      );
      return;
    }
    await generateExport({
      variables: {
        siret,
        delegateSiret,
        registryType, // RegistryV2ExportType.Ssd
        format, //FormsRegisterExportFormat.Csv
        dateRange: {
          _gte: startOfDayStartDate,
          _lt: endOfDayEndDate
        },
        declarationType, // DeclarationType.All
        wasteTypes, //RegistryV2ExportWasteType[]
        wasteCodes
      },
      onCompleted: () => {
        closeAndReset();
      },
      onError: err => setError(err.message)
    });
  };

  const isLoading = isSubmitting || generateLoading;
  const dateButtons = getDateButtons();

  return (
    <Modal
      title="Exporter"
      ariaLabel="Exporter un registre"
      onClose={closeAndReset}
      closeLabel="Annuler"
      isOpen={isOpen}
      size="M"
    >
      {companiesError || registryDelegationsError ? (
        <InlineError
          apolloError={(companiesError || registryDelegationsError)!}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
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
            {isDelegation ? (
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
                getFilterStateForRegistryType(registryType, "declarationType")
                  .disabled
              }
              nativeSelectProps={{
                ...register("declarationType")
              }}
            >
              {Object.keys(DeclarationType).map(key => (
                <option value={DeclarationType[key]} key={DeclarationType[key]}>
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
                      registryType,
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
                      registryType,
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
                      registryType,
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
                value={FormsRegisterExportFormat.Csv}
                key={FormsRegisterExportFormat.Csv}
              >
                {`Texte (.csv)`}
              </option>
              <option
                value={FormsRegisterExportFormat.Xlsx}
                key={FormsRegisterExportFormat.Xlsx}
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
        <Button
          priority="secondary"
          disabled={isLoading}
          onClick={closeAndReset}
        >
          Annuler
        </Button>
        <Button
          priority="primary"
          iconId="fr-icon-download-line"
          iconPosition="right"
          disabled={isLoading}
          onClick={handleSubmit(onSubmit)}
        >
          Exporter
        </Button>
      </div>
    </Modal>
  );
}
