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
type IconIdName = "fr-icon-arrow-right-line";

export const getTabs = (
  isCrematorium?: boolean
): {
  tabId: TabsName;
  label: string;
  iconId: IconIdName;
}[] => [
  {
    tabId: "waste",
    label: "Déchet",
    iconId: "fr-icon-arrow-right-line"
  },
  {
    tabId: "emitter",
    label: "Producteur",
    iconId: "fr-icon-arrow-right-line"
  },
  {
    tabId: "transporter",
    label: "Transporteur",
    iconId: "fr-icon-arrow-right-line"
  },
  {
    tabId: "destination",
    label: isCrematorium ? "Crématorium" : "Destination finale",
    iconId: "fr-icon-arrow-right-line"
  }
];
