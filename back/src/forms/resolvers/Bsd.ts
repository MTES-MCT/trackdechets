import { BsdResolvers } from "@td/codegen-back";
import { ReadableIdPrefix } from "../../forms/readableId";

const bsdResolvers: BsdResolvers = {
  __resolveType: parent => {
    if (parent.id.startsWith(ReadableIdPrefix.DASRI)) {
      return "Bsdasri";
    }
    if (parent.id.startsWith(ReadableIdPrefix.VHU)) {
      return "Bsvhu";
    }
    if (parent.id.startsWith(ReadableIdPrefix.BSDA)) {
      return "Bsda";
    }
    if (parent.id.startsWith(ReadableIdPrefix.FF)) {
      return "Bsff";
    }
    if (parent.id.startsWith(ReadableIdPrefix.PAOH)) {
      return "Bspaoh";
    }
    return "Form";
  }
};

export default bsdResolvers;
