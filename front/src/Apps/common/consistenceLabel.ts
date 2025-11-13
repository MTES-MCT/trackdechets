import { Consistence, Maybe } from "@td/codegen-ui";

export const getConsistenceLabel = (
  consistences: Maybe<Consistence[]> | undefined
) => {
  if (!consistences || !consistences.length) {
    return "Non soumis";
  }
  return consistences
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
