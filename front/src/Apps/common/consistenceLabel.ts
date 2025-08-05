import { Consistence, Maybe } from "@td/codegen-ui";

export const getConsistenceLabel = (
  consistence: Maybe<Consistence[]> | undefined
) => {
  if (!consistence || !consistence.length) {
    return "Non soumis";
  }
  return consistence
    .map(c => {
      switch (c) {
        case Consistence.Liquid:
          return "Liquide";
        case Consistence.Solid:
          return "Solide";
        case Consistence.Doughy:
          return "Pâteux";
        case Consistence.Gaseous:
          return "Gaseux";
        default:
          return "";
      }
    })
    .join(", ");
};
