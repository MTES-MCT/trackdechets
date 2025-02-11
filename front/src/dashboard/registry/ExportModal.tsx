import React, { useEffect, useState } from "react";
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
  UserRole,
  RegistryV2ExportType
} from "@td/codegen-ui";
import {
  GENERATE_REGISTRY_V2_EXPORT,
  GET_MY_COMPANIES_WITH_DELEGATORS,
  GET_REGISTRY_V2_EXPORTS
} from "./shared";
import { FieldError, useForm } from "react-hook-form";
import { datetimeToYYYYMMDD } from "../../Apps/Dashboard/Validation/BSPaoh/paohUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
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
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import classNames from "classnames";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { WasteCodeSwitcher } from "./WasteCodeSwitcher";
import { RegistryCompanySwitcher } from "./RegistryCompanySwitcher";

type Props = { isOpen: boolean; onClose: () => void };

type ExportCompany = {
  orgId: string;
  name: string | null | undefined;
  givenName: string | null | undefined;
  delegate: string | null;
};

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
  wasteTypes: [RegistryV2ExportWasteType, ...RegistryV2ExportWasteType[]];
  declarationType: DeclarationType;
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
      wasteTypes: [
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Texs
      ],
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Managed) {
    return {
      wasteTypes: [
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Texs
      ],
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Outgoing) {
    return {
      wasteTypes: [
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Texs
      ],
      declarationType: DeclarationType.All
    };
  } else if (registryType === RegistryV2ExportType.Transported) {
    return {
      wasteTypes: [
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Texs
      ],
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
    declarationType: DeclarationType.All
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
            message: `"La date de début doit être avant la date de fin.`
          });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: `"La date de début doit être avant la date de fin.`
          });
        }
      }
    });

const getDefaultValues = () => ({
  companyOrgId: "all",
  startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
  registryType: RegistryV2ExportType.Ssd,
  format: FormsRegisterExportFormat.Csv,
  declarationType: DeclarationType.All,
  wasteTypes: [
    RegistryV2ExportWasteType.Dd,
    RegistryV2ExportWasteType.Dnd,
    RegistryV2ExportWasteType.Texs
  ],
  wasteCodes: []
});

export function ExportModal({ isOpen, onClose }: Props) {
  const [companies, setCompanies] = useState<ExportCompany[]>([]);

  const {
    data: companiesData,
    loading,
    error
  } = useQuery<Pick<Query, "myCompanies">>(GET_MY_COMPANIES_WITH_DELEGATORS);

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

  const closeAndReset = () => {
    reset(getDefaultValues());
    onClose();
  };

  useEffect(() => {
    const rawCompanies = companiesData?.myCompanies?.edges;
    if (!rawCompanies?.length) {
      setCompanies([]);
      return;
    }
    const tmpCompanies: ExportCompany[] = [];
    rawCompanies.forEach(company => {
      if (
        company.node.userRole !== UserRole.Admin &&
        company.node.userRole !== UserRole.Member &&
        company.node.userRole !== UserRole.Reader
      ) {
        return;
      }
      tmpCompanies.push({
        orgId: company.node.orgId,
        name: company.node.name,
        givenName: company.node.givenName,
        delegate: null
      });
      if (company.node.delegators) {
        company.node.delegators.forEach(delegator => {
          tmpCompanies.push({
            orgId: delegator.orgId,
            name: delegator.name,
            givenName: delegator.givenName,
            delegate: company.node.orgId
          });
        });
      }
    });
    setCompanies(tmpCompanies);
  }, [companiesData]);

  const registryType = watch("registryType");
  const startDate = watch("startDate");

  useEffect(() => {
    const defaults = getDefaultsForRegistryType(registryType);
    Object.keys(defaults).forEach((key: "wasteTypes" | "declarationType") =>
      setValue(key, defaults[key])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryType]);

  const onSubmit = async (input: z.infer<typeof validationSchema>) => {
    const {
      companyOrgId,
      registryType,
      format,
      startDate,
      endDate,
      declarationType,
      wasteTypes,
      wasteCodes
    } = input;

    const siret = companyOrgId === "all" ? null : companyOrgId;
    let delegateSiret: string | null = null;
    // push the dates to the extremities of days so we include the days entered in the inputs
    const startOfDayStartDate = startOfDay(new Date(startDate)).toISOString();
    const endOfDayEndDate = endDate
      ? endOfDay(new Date(endDate)).toISOString()
      : null;
    if (siret) {
      const company = companies.find(comp => comp.orgId === siret);
      if (company?.delegate) {
        delegateSiret = company.delegate;
      }
    }
    if (
      registryType !== RegistryV2ExportType.Ssd &&
      registryType !== RegistryV2ExportType.Incoming &&
      registryType !== RegistryV2ExportType.Outgoing
    ) {
      toast.error(
        "Seuls les exports SSD, entrants et sortants sont supportés pour le moment"
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
        toast.success("Génération de l'export lancée !");
        closeAndReset();
      },
      onError: err => toast.error(err.message)
    });
  };

  const isLoading = isSubmitting || loading || generateLoading;
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
      {error ? (
        <InlineError apolloError={error} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="fr-mb-8v">
            <RegistryCompanySwitcher
              onCompanySelect={v => setValue("companyOrgId", v)}
              wrapperClassName={"tw-relative"}
              allOption={{
                key: "all",
                name: "Tous les établissements"
              }}
            />
            {/* <Select
              label="Établissement concerné"
              disabled={isLoading}
              nativeSelectProps={{
                ...register("companyOrgId")
              }}
            >
              <option value="all" key="all">
                Tous les établissements
              </option>
              {companies.map((company, key) => {
                const name =
                  company.givenName && company.givenName !== ""
                    ? company.givenName
                    : company.name;

                return (
                  <option value={company.orgId} key={key}>
                    {`${name} - ${company.orgId}${
                      company.delegate ? ` (délégataire)` : ""
                    }`}
                  </option>
                );
              })}
            </Select> */}
          </div>
          <div className="fr-mb-8v">
            <Select
              label="Type de registre"
              disabled={isLoading}
              nativeSelectProps={{
                ...register("registryType")
              }}
            >
              {Object.keys(RegistryV2ExportType).map(key => (
                <option
                  value={RegistryV2ExportType[key]}
                  key={RegistryV2ExportType[key]}
                >
                  {getRegistryTypeWording(RegistryV2ExportType[key])}
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
          <div className="fr-container--fluid fr-mb-8v">
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
