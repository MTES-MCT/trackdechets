import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { getTabClassName } from "../../Forms/Components/FormStepsTabs/utils";
import { toastApolloError } from "./toaster";
import { BsdType } from "@td/codegen-ui";
import { ApolloError } from "@apollo/client";

export const getNextTab = (tabIds: TabId[], currentTabId: TabId) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === tabIds.length) {
    return currentTabId;
  }
  return tabIds[idx + 1];
};

export const getPrevTab = (tabIds: TabId[], currentTabId: TabId) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === 0) {
    return currentTabId;
  }
  return tabIds[idx - 1];
};

export enum TabId {
  waste = "waste",
  emitter = "emitter",
  worker = "worker",
  transporter = "transporter",
  destination = "destination",
  none = "none",
  other = "other"
}

export type NormalizedError = {
  code: string;
  path: string[];
  message: string;
};

export type SupportedBsdTypes = BsdType.Bsvhu | BsdType.Bspaoh | BsdType.Bsda;

export type TabError = {
  tabId: TabId;
  name: string;
  message: string;
};

export type IconIdName =
  | "fr-icon-arrow-right-line"
  | "tabError fr-icon-warning-line fr-icon-arrow-right-line"
  | FrIconClassName
  | RiIconClassName;

const getDestinationTabLabel = (bsdType: SupportedBsdTypes) => {
  if (bsdType === BsdType.Bspaoh) {
    return "Crématorium";
  } else if (bsdType === BsdType.Bsda) {
    return "Destinataire";
  } else {
    return "Destination finale";
  }
};

export const getTabs = (
  bsdType: SupportedBsdTypes,
  errorTabIds?: TabId[]
): {
  tabId: TabId;
  label: string;
  iconId: IconIdName;
}[] => {
  const commonsTabs = [
    {
      tabId: TabId.waste,
      label: "Déchet",
      iconId: getTabClassName(errorTabIds, "waste")
    },
    {
      tabId: TabId.emitter,
      label: "Producteur",
      iconId: getTabClassName(errorTabIds, "emitter")
    },
    {
      tabId: TabId.transporter,
      label: "Transporteur",
      iconId: getTabClassName(errorTabIds, "transporter")
    },
    {
      tabId: TabId.destination,
      label: getDestinationTabLabel(bsdType),
      iconId: getTabClassName(errorTabIds, "destination")
    }
  ];
  if (bsdType === BsdType.Bsvhu) {
    return getBsvhuTabs(commonsTabs, errorTabIds);
  }

  if (bsdType === BsdType.Bsda) {
    return getBsdaTabs(commonsTabs, errorTabIds);
  }
  return commonsTabs;
};

const getBsvhuTabs = (commonTabs, errorTabIds) => {
  const vhuTabs = [
    ...commonTabs,
    {
      tabId: TabId.other,
      label: "Autres acteurs",
      iconId: getTabClassName(errorTabIds, "other")
    }
  ];
  return vhuTabs;
};

const getBsdaTabs = (commonTabs, errorTabIds) => {
  const bsdaTabs = [
    {
      ...commonTabs[0]
    },
    {
      ...commonTabs[1]
    },
    {
      tabId: TabId.worker,
      label: "Entreprise de travaux",
      iconId: getTabClassName(errorTabIds, "worker")
    },
    {
      ...commonTabs[2]
    },
    {
      ...commonTabs[3]
    },
    {
      tabId: TabId.other,
      label: "Autres acteurs",
      iconId: getTabClassName(errorTabIds, "other")
    }
  ];
  return bsdaTabs;
};

const pathPrefixToTab = {
  [BsdType.Bsvhu]: (pathPrefix: string): TabId | null => {
    if (
      pathPrefix === "weight" ||
      pathPrefix === "quantity" ||
      pathPrefix === "wasteCode" ||
      pathPrefix === "identification"
    ) {
      return TabId.waste;
    }
    if (pathPrefix === "ecoOrganisme") {
      return TabId.other;
    }
    if (pathPrefix.startsWith("transporter")) {
      // dirty solution to handle TransporterFooBar paths
      return TabId.transporter;
    }
    if (Object.values(TabId).includes(pathPrefix as TabId)) {
      return TabId[pathPrefix];
    }
    return null;
  },
  [BsdType.Bspaoh]: (pathPrefix: string): TabId | null => {
    if (Object.values(TabId).includes(pathPrefix as TabId)) {
      return TabId[pathPrefix];
    }
    return null;
  },
  [BsdType.Bsda]: (pathPrefix: string): TabId | null => {
    if (pathPrefix.startsWith("packagings")) {
      return TabId.waste;
    }
    if (Object.values(TabId).includes(pathPrefix as TabId)) {
      return TabId[pathPrefix];
    }
    return null;
  }
};
export const getPublishErrorTabIds = (
  bsdType: SupportedBsdTypes,
  apiErrors?: NormalizedError[]
): TabId[] => {
  // search for presence of tabId return in zod path api errors then return tab ids in error
  const publishErrorTabIds = [
    ...new Set(
      apiErrors?.map(apiError => {
        const name = (apiError.path ?? []).join(".");
        const pathPrefix = apiError.path?.[0];

        if (
          bsdType === BsdType.Bsvhu &&
          apiError.code === "too_big" &&
          name.startsWith("identificationNumbers")
        ) {
          return TabId.none;
        }

        if (pathPrefix && typeof pathPrefix === "string") {
          return pathPrefixToTab[bsdType](pathPrefix);
        }
        return null;
      })
    )
  ].filter((tabId): tabId is TabId => !!tabId);

  return publishErrorTabIds;
};

export const getPublishErrorMessages = (
  bsdType: SupportedBsdTypes,
  apiErrors?: NormalizedError[]
): TabError[] => {
  // return an array of messages with tabId, name (path) and the related message

  const publishErrorMessages =
    apiErrors
      ?.map(apiError => {
        const errorPath = apiError?.path ?? [];
        const pathPrefix = errorPath?.[0];
        const name = errorPath.join(".");

        let tabId =
          pathPrefix && typeof pathPrefix === "string"
            ? pathPrefixToTab[bsdType](pathPrefix)
            : null;

        let message = apiError.message;

        if (
          bsdType === BsdType.Bsvhu &&
          apiError.code === "too_big" &&
          name.startsWith("identificationNumbers")
        ) {
          tabId = TabId.none;
          message =
            'Le champ "Détail des identifications" ne doit pas dépasser 250 caractères.';
        }

        return { tabId, name, message };
      })
      .filter(
        (
          err
        ): err is {
          tabId: TabId;
          name: string;
          message: string;
        } => !!err.tabId
      ) ?? [];

  return publishErrorMessages;
};

export const getErrorTabIds = (
  bsdType: BsdType,
  apiErrorTabIds: TabId[],
  formStateErrorsKeys: string[]
): TabId[] => {
  // get tab id in error in order to display icon tab error (either api or front validation we need to display the right icon)
  const errorTabIds = apiErrorTabIds?.length
    ? apiErrorTabIds
    : formStateErrorsKeys?.length > 0
    ? formStateErrorsKeys.map(errKey => pathPrefixToTab[bsdType](errKey))
    : [];

  return errorTabIds;
};

export const handleGraphQlError = (err: ApolloError): NormalizedError[] => {
  const firstGqlError = err.graphQLErrors[0];
  if (!firstGqlError) {
    return [
      {
        code: "unknown",
        path: ["none"],
        message: "Une erreur inconnue est survenue"
      }
    ];
  }

  const issues = firstGqlError?.extensions?.issues as
    | Array<{
        code?: string;
        path?: Array<string | number>;
        message?: string;
      }>
    | undefined;

  if (issues?.length) {
    const normalizedIssues: NormalizedError[] = issues.map(issue => ({
      code: issue.code ?? "unknown",
      path:
        Array.isArray(issue.path) && issue.path.length > 0
          ? issue.path.map(String)
          : ["none"],
      message:
        issue.message ?? firstGqlError.message ?? "Une erreur est survenue"
    }));

    const errorsWithNonePath = normalizedIssues.filter(
      issue => !issue.path?.length || issue.path[0] === "none"
    );

    if (errorsWithNonePath.length) {
      toastApolloError(err);
    }

    return normalizedIssues;
  }

  return [
    {
      code: (firstGqlError?.extensions?.code as string) ?? "unknown",
      path: ["none"],
      message:
        firstGqlError?.message ??
        (firstGqlError?.extensions?.message as string) ??
        "Une erreur est survenue"
    }
  ];
};

export const setFieldError = (errors, errorPath, stateError, setError) => {
  const error = errors?.find(error => error.name === errorPath)?.message;

  if (error && !!stateError === false) {
    setError(errorPath, {
      type: "custom",
      message: error
    });
  }
};

export const clearCompanyError = (actor, actorName, clearErrors) => {
  clearErrors([`${actorName}.company.siret`]);
  clearErrors([`${actorName}.company.orgId`]);
  if (actor?.["company"]?.name) {
    clearErrors([`${actorName}.company.name`]);
  }
  if (actor?.["company"]?.contact) {
    clearErrors([`${actorName}.company.contact`]);
  }
  if (actor?.["company"]?.address) {
    clearErrors([`${actorName}.company.address`]);
  }
  if (actor?.["company"]?.phone) {
    clearErrors([`${actorName}.company.phone`]);
  }
  if (actor?.["company"]?.mail) {
    clearErrors([`${actorName}.company.mail`]);
  }
  if (actor?.["company"]?.vatNumber) {
    clearErrors([`${actorName}.company.vatNumber`]);
  }
};
