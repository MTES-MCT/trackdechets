import { FormResolvers } from "../../generated/graphql/types";
import stateSummary from "./forms/stateSummary";
import appendix2Forms from "./forms/appendix2Forms";
import transportSegments from "./forms/transportSegments";
import temporaryStorageDetail from "./forms/temporaryStorageDetail";
import groupedIn from "./forms/groupedIn";
import intermediaries from "./forms/intermediaries";

const formResolvers: FormResolvers = {
  appendix2Forms,
  temporaryStorageDetail,
  // Somme contextual values, depending on the form status / type, mostly to ease the display
  stateSummary,
  transportSegments,
  groupedIn,
  intermediaries
};

export default formResolvers;
