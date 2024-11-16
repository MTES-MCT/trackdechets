import React, { useEffect, useState } from "react";
import { z } from "zod";
import RegistryMenu from "./RegistryMenu";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { Loader } from "../../Apps/common/Components";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { useMutation, useQuery } from "@apollo/client";
import styles from "./MyExports.module.scss";
import {
  DeclarationType,
  FormsRegisterExportFormat,
  Mutation,
  MutationGenerateWastesRegistryExportArgs,
  Query,
  RegistryExportWasteType,
  UserRole,
  WasteRegistryType
} from "@td/codegen-ui";
import {
  GENERATE_REGISTRY_EXPORT,
  GET_MY_COMPANIES_WITH_DELEGATORS,
  GET_REGISTRY_EXPORTS
} from "./shared";
import { FieldError, useForm } from "react-hook-form";
import { datetimeToYYYYMMDD } from "../../Apps/Dashboard/Validation/BSPaoh/paohUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format, getYear, startOfDay, startOfYear, subYears } from "date-fns";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import classNames from "classnames";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Button from "@codegouvfr/react-dsfr/Button";

type ExportCompany = {
  orgId: string;
  name: string | null | undefined;
  givenName: string | null | undefined;
  delegate: string | null;
};

const displayError = (error: FieldError | undefined) => {
  return error ? error.message : null;
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
      endDate: format(startOfYear(subYears(new Date(), 2)), "yyyy-MM-dd")
    },
    {
      label: `${currentYear - 2}`,
      startDate: format(startOfYear(subYears(new Date(), 2)), "yyyy-MM-dd"),
      endDate: format(startOfYear(subYears(new Date(), 1)), "yyyy-MM-dd")
    },
    {
      label: `${currentYear - 1}`,
      startDate: format(startOfYear(subYears(new Date(), 1)), "yyyy-MM-dd"),
      endDate: format(startOfYear(new Date()), "yyyy-MM-dd")
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
        .max(startOfDay(new Date()), {
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
      registryType: z.nativeEnum(WasteRegistryType),
      format: z.nativeEnum(FormsRegisterExportFormat),
      declarationType: z.nativeEnum(DeclarationType),
      wasteTypes: z.nativeEnum(RegistryExportWasteType).array().nonempty({
        message: "Veullez sélectionner au moins un type de déchet"
      })
    })
    .refine(
      data => {
        const { startDate, endDate } = data;

        if (startDate && endDate) {
          return new Date(startDate) < new Date(endDate);
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

  const [generateExport, { loading: generateLoading }] = useMutation<
    Pick<Mutation, "generateWastesRegistryExport">,
    Omit<MutationGenerateWastesRegistryExportArgs, "where"> & {
      declarationType: DeclarationType;
      wasteTypes: RegistryExportWasteType[] | null;
      wasteCodes: string[] | null;
    }
  >(GENERATE_REGISTRY_EXPORT, {
    refetchQueries: [GET_REGISTRY_EXPORTS]
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

  const validationSchema = getSchema();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<z.infer<typeof validationSchema>>({
    defaultValues: {
      startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
      registryType: WasteRegistryType.Ssd,
      format: FormsRegisterExportFormat.Csv,
      declarationType: DeclarationType.All,
      wasteTypes: [
        RegistryExportWasteType.Dd,
        RegistryExportWasteType.Dnd,
        RegistryExportWasteType.Texs
      ]
    },
    resolver: zodResolver(validationSchema)
  });

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
    if (siret) {
      const company = companies.find(comp => comp.orgId === siret);
      if (company?.delegate) {
        delegateSiret = company.delegate;
      }
    }
    if (registryType !== WasteRegistryType.Ssd) {
      toast.error("Seul l'export SSD est supporté pour le moment");
      return;
    }
    await generateExport({
      variables: {
        siret,
        delegateSiret,
        registryType, // WasteRegistryType.Ssd
        format, //FormsRegisterExportFormat.Csv
        dateRange: {
          _gte: startDate,
          _lt: endDate
        },
        declarationType, // DeclarationType.All
        wasteTypes, //RegistryExportWasteType[]
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
      <div className="dashboard-content tw-flex-grow">
        <div
          className={classNames([
            "tw-p-6",
            isMobile ? null : styles.myExportsForm
          ])}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="fr-container--fluid fr-mb-8v">
              <Select
                label="Etablissement concerné"
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
                nativeSelectProps={{
                  ...register("registryType")
                }}
              >
                <option
                  value={WasteRegistryType.Ssd}
                  key={WasteRegistryType.Ssd}
                >
                  {`Sortie de statut de déchet`}
                </option>
                <option
                  value={WasteRegistryType.Incoming}
                  key={WasteRegistryType.Incoming}
                >
                  {`Registre entrant`}
                </option>
                <option
                  value={WasteRegistryType.Managed}
                  key={WasteRegistryType.Managed}
                >
                  {`Registre géré`}
                </option>
                <option
                  value={WasteRegistryType.Outgoing}
                  key={WasteRegistryType.Outgoing}
                >
                  {`Registre sortant`}
                </option>
                <option
                  value={WasteRegistryType.Transported}
                  key={WasteRegistryType.Transported}
                >
                  {`Registre transporté`}
                </option>
                <option
                  value={WasteRegistryType.All}
                  key={WasteRegistryType.All}
                >
                  {`Registre exhaustif`}
                </option>
              </Select>
            </div>
            <div className="fr-container--fluid fr-mb-8v">
              <Select
                label="Type de déclaration"
                nativeSelectProps={{
                  ...register("declarationType")
                }}
              >
                <option value={DeclarationType.All} key={DeclarationType.All}>
                  {`Tous`}
                </option>
                <option value={DeclarationType.Bsd} key={DeclarationType.Bsd}>
                  {`Tracé`}
                </option>
                <option
                  value={DeclarationType.Registry}
                  key={DeclarationType.Registry}
                >
                  {`Déclaré`}
                </option>
              </Select>
            </div>
            <div className="fr-container--fluid">
              <Checkbox
                hintText="Sélectionner au moins un type de déchets"
                legend="Type de déchets"
                options={[
                  {
                    label: "Déchets non dangereux",
                    nativeInputProps: {
                      value: RegistryExportWasteType.Dnd,
                      ...register("wasteTypes")
                    }
                  },
                  {
                    label: "Déchets dangereux",
                    nativeInputProps: {
                      value: RegistryExportWasteType.Dd,
                      ...register("wasteTypes")
                    }
                  },
                  {
                    label: "Terres et sédiments",
                    nativeInputProps: {
                      value: RegistryExportWasteType.Texs,
                      ...register("wasteTypes")
                    }
                  }
                ]}
              />
            </div>
            <h6 className="fr-h6">{`Période concernée`}</h6>
            <div className={classNames(["fr-mb-8v", styles.dateButtons])}>
              {dateButtons.map(dateButton => (
                <Button
                  onClick={() => {
                    setValue("startDate", dateButton.startDate);
                    if (dateButton.endDate) {
                      setValue("endDate", dateButton.endDate);
                    } else {
                      setValue("endDate", null);
                    }
                  }}
                  type="button"
                  priority="tertiary"
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
            <div className="fr-container--fluid fr-mb-8v">
              <Button
                priority="primary"
                iconId="fr-icon-download-line"
                iconPosition="right"
              >
                Exporter
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
