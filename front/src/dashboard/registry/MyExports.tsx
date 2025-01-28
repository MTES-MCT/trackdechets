import React, { useEffect, useState } from "react";
import { z } from "zod";
import RegistryMenu from "./RegistryMenu";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { Loader } from "../../Apps/common/Components";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  FormsRegisterExportFormat,
  Mutation,
  MutationGenerateRegistryV2ExportArgs,
  Query,
  QueryRegistryV2ExportDownloadSignedUrlArgs,
  RegistryV2ExportStatus,
  RegistryV2ExportWasteType,
  UserRole,
  RegistryV2ExportType
} from "@td/codegen-ui";
import {
  badges,
  downloadFromSignedUrl,
  GENERATE_REGISTRY_V2_EXPORT,
  GET_MY_COMPANIES_WITH_DELEGATORS,
  GET_REGISTRY_V2_EXPORTS,
  REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL
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
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import classNames from "classnames";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";
import Table from "@codegouvfr/react-dsfr/Table";
import Tooltip from "@codegouvfr/react-dsfr/Tooltip";

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

const formatRegistryDates = (
  createdAt: string,
  startDate: string,
  endDate?: string | null
): string => {
  const startDateObj = new Date(startDate);
  const endDateObj = endDate ? new Date(endDate) : null;
  if (
    format(startOfYear(startDateObj), "yyyy-MM-dd") ===
      format(startDateObj, "yyyy-MM-dd") &&
    endDateObj &&
    format(endOfYear(endDateObj), "yyyy-MM-dd") ===
      format(endDateObj, "yyyy-MM-dd")
  ) {
    return `${getYear(startDateObj)}`;
  }
  if (!endDateObj) {
    return `du ${format(startDateObj, "dd/MM/yyyy")} au ${format(
      new Date(createdAt),
      "dd/MM/yyyy"
    )}`;
  }
  return `du ${format(startDateObj, "dd/MM/yyyy")} au ${format(
    endDateObj,
    "dd/MM/yyyy"
  )}`;
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
      })
    })
    .refine(
      data => {
        const { startDate, endDate } = data;

        if (startDate && endDate) {
          return new Date(startDate) <= new Date(endDate);
        }

        return true;
      },
      {
        path: ["startDate"],
        message: "La date de début doit être avant la date de fin."
      }
    );

export function MyExports() {
  const [companies, setCompanies] = useState<ExportCompany[]>([]);
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  const {
    data: companiesData,
    loading,
    error
  } = useQuery<Pick<Query, "myCompanies">>(GET_MY_COMPANIES_WITH_DELEGATORS);

  const {
    data: exportsData,
    loading: exportsLoading,
    refetch
  } = useQuery<Pick<Query, "registryV2Exports">>(GET_REGISTRY_V2_EXPORTS);
  const registryExports = exportsData?.registryV2Exports?.edges;
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

  const [getDownloadLink] = useLazyQuery<
    Pick<Query, "registryV2ExportDownloadSignedUrl">,
    Partial<QueryRegistryV2ExportDownloadSignedUrlArgs>
  >(REGISTRY_V2_EXPORT_DOWNLOAD_SIGNED_URL, { fetchPolicy: "no-cache" });

  async function downloadRegistryExportFile(exportId: string) {
    const link = await getDownloadLink({
      variables: { exportId }
    });
    await downloadFromSignedUrl(
      link.data?.registryV2ExportDownloadSignedUrl.signedUrl
    );
  }

  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: {
      startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
      registryType: RegistryV2ExportType.Ssd,
      format: FormsRegisterExportFormat.Csv,
      declarationType: DeclarationType.All,
      wasteTypes: [
        RegistryV2ExportWasteType.Dd,
        RegistryV2ExportWasteType.Dnd,
        RegistryV2ExportWasteType.Texs
      ]
    },
    resolver: zodResolver(validationSchema)
  });

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
      wasteTypes
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
    if (registryType !== RegistryV2ExportType.Ssd) {
      toast.error("Seul l'export SSD est supporté pour le moment");
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
        wasteCodes: null
      },
      onCompleted: () => toast.success("Génération de l'export lancée !"),
      onError: err => toast.error(err.message)
    });
  };

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;
  const isLoading = loading || isSubmitting || generateLoading;
  const dateButtons = getDateButtons();
  return (
    <div id="my-registry-exports" className="dashboard">
      {!isMobile && <RegistryMenu />}
      <div
        className={classNames([
          "tw-flex-grow",
          styles.myRegistryExportsContainer
        ])}
      >
        <div
          className={classNames([
            "tw-p-6",
            isMobile ? null : styles.myExportsForm
          ])}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fr-container--fluid fr-mb-8v">
              <Select
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
              </Select>
            </div>
            <div className="fr-container--fluid fr-mb-8v">
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
                    hintText="Jusqu'à aujourd'hui s'il n'y a pas de date renseignée"
                    state={errors?.endDate && "error"}
                    stateRelatedMessage={displayError(errors?.endDate)}
                    disabled={isLoading}
                    nativeInputProps={{
                      type: "date",
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
            <div className="fr-container--fluid">
              <Button
                priority="primary"
                iconId="fr-icon-download-line"
                iconPosition="right"
                disabled={isLoading}
              >
                Exporter
              </Button>
            </div>
          </form>
        </div>
        <div className="tw-p-6">
          {!exportsLoading ? (
            <Table
              caption="Exports récents"
              data={
                registryExports
                  ? registryExports.map(registryExport => [
                      <div>
                        <div>
                          {format(
                            new Date(registryExport.node.createdAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </div>
                        {badges[registryExport.node.status]("export")}
                      </div>,
                      <div>
                        {[
                          `${
                            registryExport.node.companies[0]?.givenName &&
                            registryExport.node.companies[0]?.givenName !== ""
                              ? registryExport.node.companies[0]?.givenName
                              : registryExport.node.companies[0]?.name
                          } - ${registryExport.node.companies[0]?.orgId}`,
                          ...(registryExport.node.companies.length > 1
                            ? [
                                `et ${
                                  registryExport.node.companies.length - 1
                                } autre${
                                  registryExport.node.companies.length > 2
                                    ? "s"
                                    : ""
                                } `
                              ]
                            : [])
                        ].join(", ")}
                        {registryExport.node.companies.length > 1 ? (
                          <Tooltip
                            kind="hover"
                            className={styles.prewrap}
                            title={registryExport.node.companies
                              .slice(1)
                              .map(
                                company =>
                                  `${
                                    company.givenName &&
                                    company.givenName !== ""
                                      ? company.givenName
                                      : company.name
                                  } - ${company.orgId}`
                              )
                              .join(",\n")}
                          />
                        ) : null}
                      </div>,
                      getRegistryTypeWording(registryExport.node.registryType),
                      getDeclarationTypeWording(
                        registryExport.node.declarationType
                      ),
                      formatRegistryDates(
                        registryExport.node.createdAt,
                        registryExport.node.startDate,
                        registryExport.node.endDate
                      ),
                      registryExport.node.status ===
                      RegistryV2ExportStatus.Successful ? (
                        <Button
                          title="Télécharger"
                          priority="secondary"
                          iconId="fr-icon-download-line"
                          onClick={() =>
                            downloadRegistryExportFile(registryExport.node.id)
                          }
                          size="small"
                        />
                      ) : registryExport.node.status ===
                          RegistryV2ExportStatus.Pending ||
                        registryExport.node.status ===
                          RegistryV2ExportStatus.Started ? (
                        <Button
                          title="Rafraîchir"
                          disabled={exportsLoading}
                          priority="secondary"
                          iconId="fr-icon-refresh-line"
                          onClick={() => refetch()}
                          size="small"
                        />
                      ) : (
                        ""
                      )
                    ])
                  : []
              }
              headers={[
                "Date",
                "Établissements",
                "Type de registre",
                "Type de déclaration",
                "Période",
                "Fichier"
              ]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
