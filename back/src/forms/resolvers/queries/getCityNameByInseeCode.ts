import type { QueryResolvers } from "@td/codegen-back";
import { z } from "zod";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCityNameByInseeCode as getCityNameByInseeCodeFn } from "../../../companies/geo/geoCommune";

const argsSchema = z.object({
  inseeCode: z
    .string()
    .length(5, "Le code INSEE doit contenir exactement 5 caractères")
    .regex(
      /^(\d{5}|2[AB]\d{3})$/,
      "Le code INSEE doit être composé de 5 chiffres ou commencer par 2A/2B pour la Corse"
    )
});

const getCityNameByInseeCodeResolver: QueryResolvers["getCityNameByInseeCode"] =
  async (_, args, context) => {
    checkIsAuthenticated(context);

    const { inseeCode } = argsSchema.parse(args);

    return await getCityNameByInseeCodeFn(inseeCode);
  };

export default getCityNameByInseeCodeResolver;
