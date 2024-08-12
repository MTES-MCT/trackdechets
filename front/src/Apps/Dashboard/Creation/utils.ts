import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import { getTabClassName } from "../../Forms/Components/FormStepsTabs/utils";
import { toastApolloError } from "./toaster";

export const getNextTab = (tabIds, currentTabId) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === tabIds.length) {
    return currentTabId;
  }
  return tabIds[idx + 1];
};

export const getPrevTab = (tabIds, currentTabId) => {
  const idx = tabIds.indexOf(currentTabId);
  if (idx === -1 || idx === 0) {
    return currentTabId;
  }
  return tabIds[idx - 1];
};

export type TabsName = "waste" | "emitter" | "transporter" | "destination";
export type IconIdName =
  | "fr-icon-arrow-right-line"
  | "tabError fr-icon-warning-line fr-icon-arrow-right-line"
  | FrIconClassName
  | RiIconClassName;

export const getTabs = (
  isCrematorium?: boolean,
  errorTabIds?: string[] | (TabsName | undefined)[]
): {
  tabId: TabsName;
  label: string;
  iconId: IconIdName;
}[] => [
  {
    tabId: "waste",
    label: "Déchet",
    iconId: getTabClassName(errorTabIds, "waste")
  },
  {
    tabId: "emitter",
    label: "Producteur",
    iconId: getTabClassName(errorTabIds, "emitter")
  },
  {
    tabId: "transporter",
    label: "Transporteur",
    iconId: getTabClassName(errorTabIds, "transporter")
  },
  {
    tabId: "destination",
    label: isCrematorium ? "Crématorium" : "Destination finale",
    iconId: getTabClassName(errorTabIds, "destination")
  }
];

export const getPublishErrorTabIds = (apiErrors, tabIds) => {
  // search for presence of tabId return in zod path api errors then return tab ids in error
  const publishErrorTabIds = [
    ...new Set(
      apiErrors?.map(apiError => {
        if (apiError.path[0].includes("weight")) {
          return tabIds.find(key => key === "waste");
        }
        return tabIds.find(key => apiError.path[0].includes(key));
      })
    )
  ];

  return publishErrorTabIds as string[] | (TabsName | undefined)[];
};

export const getPublishErrorMessages = apiErrors => {
  // return an array of messages with tabId, name (path) and the related message
  const publishErrorMessages = apiErrors?.map(apiError => {
    const formattedError = apiError.path[0]
      .split(/(?=[A-Z])/)
      .map(s => s.toLowerCase()); // FIXME camel case split (waiting for zod path normalisation)
    const pathPrefix = formattedError?.[0];
    const tabId = pathPrefix === "weight" ? "waste" : pathPrefix;
    const name = formattedError.join("."); // FIXME after back normalisation
    const message = apiError.message;
    return { tabId, name, message };
  });

  return publishErrorMessages;
};

export const getErrorTabIds = (apiErrorTabIds, formStateErrorsKeys) => {
  // get tab id in error in order to display icon tab error (either api or front validation we need to display the right icon)
  const errorTabIds = apiErrorTabIds?.length
    ? apiErrorTabIds
    : formStateErrorsKeys?.length > 0
    ? formStateErrorsKeys
    : [];

  return errorTabIds;
};

export const handleGraphQlError = (err, setPublishErrors) => {
  if (err?.graphQLErrors?.length) {
    const issues = err.graphQLErrors[0]?.extensions?.issues as {
      code: string;
      path: string[];
      message: string;
    }[];
    if (issues?.length) {
      const errorDetailList = issues?.map(error => {
        return error;
      });
      setPublishErrors(
        errorDetailList as {
          code: string;
          path: string[];
          message: string;
        }[]
      );
    } else {
      toastApolloError(err); // other case like forbidden, we need to display an error anyway ...
    }
  } else {
    toastApolloError(err); // other case like forbidden, we need to display an error anyway ...
  }
};

export const isVatNumberPath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.vat.number`)
    ?.message; // FIXME  verify vatNumber camel case ?

export const isCompanyMailPath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.mail`)?.message;

export const isCompanyPhonePath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.phone`)?.message;

export const isCompanyAddressPath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.address`)?.message;

export const isCompanyContactPath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.contact`)?.message;

export const isCompanySiretPath = (apiErrors, actor) =>
  apiErrors?.find(error => error.name === `${actor}.company.siret`)?.message;
