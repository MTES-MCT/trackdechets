import type { QueryResolvers } from "@td/codegen-back";
import { z } from "zod";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCommuneByCoords } from "../../../companies/geo/geoCommune";

const argsSchema = z.object({
  lat: z
    .number()
    .min(-90, "La latitude doit être comprise entre -90 et 90")
    .max(90, "La latitude doit être comprise entre -90 et 90"),
  lng: z
    .number()
    .min(-180, "La longitude doit être comprise entre -180 et 180")
    .max(180, "La longitude doit être comprise entre -180 et 180")
});

const getCommuneByCoordinatesResolver: QueryResolvers["getCommuneByCoordinates"] =
  async (_, args, context) => {
    checkIsAuthenticated(context);

    const { lat, lng } = argsSchema.parse(args);

    return await getCommuneByCoords(lat, lng);
  };

export default getCommuneByCoordinatesResolver;
