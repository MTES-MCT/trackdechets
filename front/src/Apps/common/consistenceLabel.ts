import { Consistence, Maybe } from "@td/codegen-ui";

export const getConsistenceLabel = (
  consistence: Maybe<Consistence> | undefined
) => {
  if (!consistence) {
    return "Non soumis";
  }

  switch (consistence) {
    case Consistence.Liquid:
      return "Liquide";
    case Consistence.Solid:
      return "Solide";
    case Consistence.Doughy:
      return "Pâteux";
    case Consistence.Gaseous:
      return "Gazeux";
    default:
      return "";
  }
};
