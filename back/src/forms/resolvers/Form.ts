import { FormResolvers } from "../../generated/graphql/types";
import stateSummary from "./forms/stateSummary";
import appendix2Forms from "./forms/appendix2Forms";
import transportSegments from "./forms/transportSegments";
import groupedIn from "./forms/groupedIn";
import grouping from "./forms/grouping";
import intermediaries from "./forms/intermediary";
import quantityGrouped from "./forms/quantityGrouped";
import transporter2 from "./forms/transporter2";
import transporter3 from "./forms/transporter3";
import transporter4 from "./forms/transporter4";
import transporter5 from "./forms/transporter5";

const formResolvers: FormResolvers = {
  appendix2Forms,
  // Somme contextual values, depending on the form status / type, mostly to ease the display
  stateSummary,
  transportSegments,
  groupedIn,
  grouping,
  intermediaries,
  quantityGrouped,
  transporter2,
  transporter3,
  transporter4,
  transporter5
};

export default formResolvers;
