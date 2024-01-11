import { FormResolvers } from "../../generated/graphql/types";
import stateSummary from "./forms/stateSummary";
import appendix2Forms from "./forms/appendix2Forms";
import groupedIn from "./forms/groupedIn";
import grouping from "./forms/grouping";
import intermediaries from "./forms/intermediary";

const formResolvers: FormResolvers = {
  appendix2Forms,
  // Somme contextual values, depending on the form status / type, mostly to ease the display
  stateSummary,
  groupedIn,
  grouping,
  intermediaries,
  metadata: bsdd => {
    return {
      ...bsdd.metadata,
      id: bsdd.id
    } as any;
  }
};

export default formResolvers;
