import { Bsdasri, Prisma } from "@prisma/client";
import { LogMetadata, RepositoryFnDeps } from "../../../forms/repository/types";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";

export type UpdateBsdasriFn = (
  where: Prisma.BsdasriWhereUniqueInput,
  data: Prisma.XOR<
    Prisma.BsdasriUpdateInput,
    Prisma.BsdasriUncheckedUpdateInput
  >,
  logMetadata?: LogMetadata
) => Promise<Bsdasri>;

export function buildUpdateBsdasri(deps: RepositoryFnDeps): UpdateBsdasriFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const bsdasri = await prisma.bsdasri.update({ where, data });

    await prisma.event.create({
      data: {
        streamId: bsdasri.id,
        actor: user.id,
        type: "BsdasriUpdated",
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    // Status updates are done only through signature
    if (data.status) {
      await prisma.event.create({
        data: {
          streamId: bsdasri.id,
          actor: user.id,
          type: "BsdasriSigned",
          data: { status: data.status },
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() => enqueueBsdToIndex(bsdasri.id));

    return bsdasri;
  };
}
