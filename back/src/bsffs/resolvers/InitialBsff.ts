import { BsffResolvers } from "../../generated/graphql/types";
import { checkCanRead } from "../permissions";
import { Bsff } from "./Bsff";
import { getReadonlyBsffRepository } from "../repository";
import { ForbiddenError } from "../../common/errors";

export const InitialBsff: BsffResolvers = {
  packagings: Bsff.packagings,
  ficheInterventions: Bsff.ficheInterventions,
  emitter: async ({ id, emitter }, _, { user }) => {
    const { findUnique } = getReadonlyBsffRepository();
    const bsff = await findUnique({
      where: { id },
      include: { transporters: true }
    });
    try {
      await checkCanRead(user!, bsff!);
    } catch (err) {
      throw new ForbiddenError(
        `Vous ne pouvez pas accéder au champ "emitter" du bordereau initial ${id}`
      );
    }
    return emitter ?? null;
  }
};
