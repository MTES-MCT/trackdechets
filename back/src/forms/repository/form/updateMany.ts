import { Prisma } from "@prisma/client";
import { GraphQLContext } from "../../../types";
import { indexForm } from "../../elastic";
import { LogMetadata, RepositoryFnDeps } from "../types";
import buildFindFullFormById from "./findFullFormById";

export type UpdateManyFormFn = (
  ids: string[],
  data: Prisma.FormUpdateInput,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

const buildUpdateManyForms: (deps: RepositoryFnDeps) => UpdateManyFormFn =
  deps => async (ids, data, logMetadata) => {
    const { prisma, user } = deps;

    const update = await prisma.form.updateMany({
      where: { id: { in: ids } },
      data
    });

    for (const id of ids) {
      await prisma.event.create({
        data: {
          streamId: id,
          actor: user.id,
          type: "BsddUpdated",
          data: { content: data } as Prisma.InputJsonObject,
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
    }

    await Promise.all(
      ids.map(async id => {
        const form = await buildFindFullFormById(deps)(id);
        indexForm(form, { user } as GraphQLContext);
      })
    );

    return update;
  };

export default buildUpdateManyForms;
