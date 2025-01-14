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

export type SupportedBsdTypes = BsdType.Bsvhu | BsdType.Bspaoh;

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
      label: bsdType === BsdType.Bspaoh ? "Crématorium" : "Destination finale",
      iconId: getTabClassName(errorTabIds, "destination")
    }
  ];
  if (bsdType === BsdType.Bsvhu) {
    return getBsvhuTabs(commonsTabs, errorTabIds);
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
        if (apiError.path?.[0] && typeof apiError.path[0] === "string") {
          return pathPrefixToTab[bsdType](apiError.path[0]);
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
        const errorPath = apiError?.path;
        const pathPrefix = errorPath?.[0];
        const tabId = pathPrefixToTab[bsdType](pathPrefix);
        const name = errorPath.join(".");
        const message = apiError.message;
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

export const handleGraphQlError = (
  err: ApolloError,
  setPublishErrors: (normalizedErrors: NormalizedError[]) => void
) => {
  if (err.graphQLErrors?.length) {
    const issues = err.graphQLErrors[0]?.extensions
      ?.issues as NormalizedError[];
    if (issues?.length) {
      const errorsWithEmptyPath = issues.filter(f => !f.path.length);
      if (errorsWithEmptyPath.length) {
        toastApolloError(err);
      }
      const errorDetailList = issues?.map(error => {
        return error;
      });
      setPublishErrors(errorDetailList as NormalizedError[]);
    } else {
      // other case like forbidden, we need to display an error anyway ...
      setPublishErrors([
        {
          code: err.graphQLErrors[0]?.extensions?.code,
          path: ["none"],
          message: err.graphQLErrors[0]?.message
        }
      ] as NormalizedError[]);
    }
  } else {
    // other case like forbidden, we need to display an error anyway ...
    setPublishErrors([
      {
        code: err.graphQLErrors[0]?.extensions?.code,
        path: ["none"],
        message: err.graphQLErrors[0]?.extensions?.message
      }
    ] as NormalizedError[]);
  }
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
