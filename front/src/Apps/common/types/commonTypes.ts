export enum inputType {
  text = "text"
}

export type BsdCurrentTab =
  | "draftTab"
  | "actTab"
  | "toCollectTab"
  | "followTab"
  | "archivesTab"
  | "collectedTab"
  | "returnTab"
  | "allBsdsTab"
  | "pendingRevisionForTab"
  | "emittedRevisionForTab"
  | "receivedRevisionForTab"
  | "reviewedRevisionForTab";
