import React, {
  createContext,
  useCallback,
  useContext,
  // useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { format, startOfYear, endOfDay, startOfDay } from "date-fns";
import { z } from "zod";
import { type UseFormReturn, useForm } from "react-hook-form";

import {
  Query,
  DeclarationType,
  RegistryV2ExportType,
  RegistryExportFormat,
  RegistryV2ExportWasteType,
  Mutation,
  MutationGenerateRegistryV2ExportArgs,
  CompanyType
} from "@td/codegen-ui";
import {
  GENERATE_REGISTRY_V2_EXPORT,
  GET_REGISTRY_V2_EXPORTS,
  GET_MY_COMPANIES,
  GENERATE_REGISTRY_V2_EXPORT_AS_ADMIN,
  GET_REGISTRY_V2_EXPORTS_AS_ADMIN,
  SEARCH_COMPANIES
} from "./shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGISTRY_DELEGATIONS } from "../../Apps/common/queries/registryDelegation/queries";
import { useRegistryExport } from "./RegistryV2ExportContext";
import {
  exhaustiveValidationSchema,
  RegistryExhaustiveExportModalContext
} from "./RegistryExhaustiveExportModalContext";

export type BaseRegistryExportModalContext = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  submit: () => void;
  methods: UseFormReturn<any>;
  asAdmin: boolean;
};

export type RegistryExportModalContextType =
  | (BaseRegistryExportModalContext & {
      type: "registryV2";
      registryDelegationsData: Pick<Query, "registryDelegations"> | undefined;
      registryDelegationsLoading: boolean;
      companiesError: ApolloError | undefined;
      possibleExportTypes: RegistryV2ExportType[];
    })
  | (BaseRegistryExportModalContext & {
      type: "registryExhaustive";
      registryDelegationsData?: never;
      registryDelegationsLoading?: never;
      companiesError?: never;
      possibleExportTypes?: never;
    });

export const RegistryV2ExportModalContext =
  createContext<RegistryExportModalContextType | null>(null);

export const useRegistryExportModal = (): RegistryExportModalContextType => {
  const exhaustiveContext = useContext(RegistryExhaustiveExportModalContext);
  const v2Context = useContext(RegistryV2ExportModalContext);

  if (!exhaustiveContext && !v2Context) {
    throw new Error(
      "useRegistryExport has to be used within <RegistryExhaustiveExportModalContext.Provider> or <RegistryExportModalContext.Provider>"
    );
  }

  return exhaustiveContext || (v2Context as RegistryExportModalContextType);
};

export const validationSchema = exhaustiveValidationSchema.extend({
  isDelegation: z.boolean(),
  delegateSiret: z.string().nullable(),
  registryType: z.nativeEnum(RegistryV2ExportType),
  declarationType: z.nativeEnum(DeclarationType),
  wasteTypes: z.nativeEnum(RegistryV2ExportWasteType).array().nonempty({
    message: "Veullez sélectionner au moins un type de déchet"
  }),
  wasteCodes: z.string().array()
});

const refinedSchema = validationSchema.superRefine(
  ({ startDate, endDate }, ctx) => {
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
  }
);

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

const getDefaultValues = (asAdmin: boolean) => ({
  companyOrgId: asAdmin ? "" : "all",
  isDelegation: false,
  delegateSiret: null,
  startDate: format(startOfYear(new Date()), "yyyy-MM-dd"),
  registryType: RegistryV2ExportType.Incoming,
  format: RegistryExportFormat.Csv,
  declarationType: DeclarationType.All,
  wasteTypes: [
    RegistryV2ExportWasteType.Dd,
    RegistryV2ExportWasteType.Dnd,
    RegistryV2ExportWasteType.Texs
  ],
  wasteCodes: []
});

export const RegistryV2ExportModalProvider: React.FC<{
  children: React.ReactNode;
  asAdmin?: boolean;
}> = ({ children, asAdmin = false }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refetch: refetchExports } = useRegistryExport();

  const [generateExport, { loading: generateLoading }] = useMutation<
    Pick<
      Mutation,
      "generateRegistryV2Export" | "generateRegistryV2ExportAsAdmin"
    >,
    Omit<MutationGenerateRegistryV2ExportArgs, "where"> & {
      declarationType: DeclarationType;
      wasteTypes: RegistryV2ExportWasteType[] | null;
      wasteCodes: string[] | null;
    }
  >(
    asAdmin
      ? GENERATE_REGISTRY_V2_EXPORT_AS_ADMIN
      : GENERATE_REGISTRY_V2_EXPORT,
    {
      refetchQueries: [
        asAdmin ? GET_REGISTRY_V2_EXPORTS_AS_ADMIN : GET_REGISTRY_V2_EXPORTS
      ]
    }
  );

  const methods = useForm<z.infer<typeof refinedSchema>>({
    defaultValues: getDefaultValues(asAdmin),
    resolver: zodResolver(refinedSchema)
  });
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting }
  } = methods;
  const companyOrgId = watch("companyOrgId");
  const isDelegation = watch("isDelegation");
  const registryType = watch("registryType");

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

  const { data: companiesData, error: registryCompaniesError } = useQuery<
    Pick<Query, "myCompanies">
  >(GET_MY_COMPANIES, {
    variables: {
      search: companyOrgId
    },
    skip: isDelegation || asAdmin,
    fetchPolicy: "network-only"
  });

  const { data: searchCompaniesData, error: searchCompaniesError } = useQuery<
    Pick<Query, "searchCompanies">
  >(SEARCH_COMPANIES, {
    variables: {
      clue: companyOrgId
    },
    skip: !asAdmin,
    fetchPolicy: "network-only"
  });

  const onClose = useCallback(() => {
    setError(null);
    reset(getDefaultValues(asAdmin));
    setIsExportModalOpen(false);
    refetchExports();
  }, [reset, refetchExports, asAdmin]);

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
    const companies = asAdmin
      ? searchCompaniesData?.searchCompanies
      : isDelegation
      ? registryDelegationsData?.registryDelegations.edges.map(
          d => d.node.delegator
        )
      : companiesData?.myCompanies.edges.map(c => c.node);
    const selectedCompany = companies?.find(c => c.orgId === companyOrgId);
    if (!selectedCompany || !selectedCompany.companyTypes) {
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
  }, [
    companyOrgId,
    isDelegation,
    companiesData,
    registryDelegationsData,
    searchCompaniesData,
    asAdmin
  ]);

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

  const onSubmit = useCallback(
    async (input: z.infer<typeof refinedSchema>) => {
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
                .orgId;
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
          format, //RegistryExportFormat.Csv
          dateRange: {
            _gte: startOfDayStartDate,
            _lt: endOfDayEndDate
          },
          declarationType, // DeclarationType.All
          wasteTypes, //RegistryV2ExportWasteType[]
          wasteCodes
        },
        onCompleted: () => {
          onClose();
        },
        onError: err => setError(err.message)
      });
    },
    [onClose, generateExport, registryDelegationsData]
  );

  const submit = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const isLoading = isSubmitting || generateLoading;
  return (
    <RegistryV2ExportModalContext.Provider
      value={{
        type: "registryV2",
        isOpen: isExportModalOpen,
        onOpen: () => setIsExportModalOpen(true),
        onClose,
        registryDelegationsData,
        registryDelegationsLoading,
        isLoading,
        companiesError:
          registryDelegationsError ||
          registryCompaniesError ||
          searchCompaniesError,
        error,
        methods,
        submit,
        possibleExportTypes,
        asAdmin: !!asAdmin
      }}
    >
      {children}
    </RegistryV2ExportModalContext.Provider>
  );
};
// export default useRegistryExport;
