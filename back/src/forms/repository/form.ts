import {
  Form,
  Prisma,
  PrismaClient,
  Status,
  TemporaryStorageDetail
} from "@prisma/client";
import { LogMetadata } from "./index";
import { deleteBsd } from "../../common/elastic";
import { GraphQLContext } from "../../types";
import { indexForm } from "../elastic";

const formWithLinkedObjects = Prisma.validator<Prisma.FormArgs>()({
  include: { temporaryStorageDetail: true, transportSegments: true }
});
type FullForm = Prisma.FormGetPayload<typeof formWithLinkedObjects>;

export type FormActions = {
  findUnique(
    where: Prisma.FormWhereUniqueInput,
    options?: Omit<Prisma.FormFindUniqueArgs, "where">
  ): Promise<Form>;
  findFullFormById(id: string): Promise<FullForm>;
  findAppendix2FormsById(id: string): Promise<Form[]>;
  create(
    data: Prisma.FormCreateInput,
    logMetadata?: LogMetadata
  ): Promise<Form>;
  update(
    where: Prisma.FormWhereUniqueInput,
    data: Prisma.FormUpdateInput,
    logMetadata?: LogMetadata
  ): Promise<Form>;
  updateMany(
    ids: string[],
    data: Prisma.FormUpdateInput,
    logMetadata?: LogMetadata
  ): Promise<Prisma.BatchPayload>;
  delete(
    where: Prisma.FormWhereUniqueInput,
    logMetadata?: LogMetadata
  ): Promise<Form>;
  createTemporaryStorage(
    data: Prisma.TemporaryStorageDetailCreateInput
  ): Promise<TemporaryStorageDetail>;
  count(where: Prisma.FormWhereInput): Promise<number>;
};

export function buildFormRepository(
  dbClient: PrismaClient,
  user: Express.User
): FormActions {
  function findUnique(
    where: Prisma.FormWhereUniqueInput,
    options?: Omit<Prisma.FormFindUniqueArgs, "where">
  ): Promise<Form> {
    const input = { where, ...options };
    return dbClient.form.findUnique(input);
  }

  async function findFullFormById(id: string): Promise<FullForm> {
    return dbClient.form.findUnique({
      where: { id },
      ...formWithLinkedObjects
    });
  }

  async function findAppendix2FormsById(id: string): Promise<Form[]> {
    return dbClient.form.findUnique({ where: { id } }).appendix2Forms();
  }

  async function create(
    data: Prisma.FormCreateInput,
    logMetadata?: LogMetadata
  ): Promise<Form> {
    const newForm = await dbClient.$transaction(async transaction => {
      const form = await transaction.form.create({ data });

      await transaction.statusLog.create({
        data: {
          form: { connect: { id: form.id } },
          user: { connect: { id: user.id } },
          status: form.status,
          updatedFields: {},
          authType: user.auth,
          loggedAt: form.createdAt
        }
      });

      await transaction.event.create({
        data: {
          streamId: form.id,
          actor: user.id,
          type: "BsddCreated",
          data: { content: data } as Prisma.InputJsonObject,
          metadata: { ...logMetadata, authType: user.auth }
        }
      });

      return form;
    });

    const fullForm = await findFullFormById(newForm.id);
    await indexForm(fullForm, { user } as GraphQLContext);

    return newForm;
  }

  async function update(
    where: Prisma.FormWhereUniqueInput,
    data: Prisma.FormUpdateInput,
    logMetadata?: LogMetadata
  ): Promise<Form> {
    const updatedForm = await dbClient.$transaction(async transaction => {
      const form = await transaction.form.update({
        where,
        data
      });

      await transaction.event.create({
        data: {
          streamId: form.id,
          actor: user.id,
          type: "BsddUpdated",
          data: { content: data } as Prisma.InputJsonObject,
          metadata: { ...logMetadata, authType: user.auth }
        }
      });

      return form;
    });

    const fullForm = await findFullFormById(updatedForm.id);
    await indexForm(fullForm, { user } as GraphQLContext);

    return updatedForm;
  }

  async function updateMany(
    ids: string[],
    data: Prisma.FormUpdateInput,
    logMetadata?: LogMetadata
  ): Promise<Prisma.BatchPayload> {
    const result = await dbClient.$transaction(async transaction => {
      const update = await transaction.form.updateMany({
        where: { id: { in: ids } },
        data
      });

      for (const id of ids) {
        await transaction.event.create({
          data: {
            streamId: id,
            actor: user.id,
            type: "BsddUpdated",
            data: { content: data } as Prisma.InputJsonObject,
            metadata: { ...logMetadata, authType: user.auth }
          }
        });
      }

      return update;
    });

    await Promise.all(
      ids.map(async id => {
        const form = await findFullFormById(id);
        indexForm(form, { user } as GraphQLContext);
      })
    );

    return result;
  }

  async function deleteForm(
    where: Prisma.FormWhereUniqueInput,
    logMetadata?: LogMetadata
  ): Promise<Form> {
    const deletedForm = await dbClient.$transaction(async transaction => {
      const form = await transaction.form.update({
        where,
        data: { isDeleted: true, appendix2Forms: { set: [] } }
      });

      const appendix2Forms = await findAppendix2FormsById(form.id);

      if (appendix2Forms.length) {
        // roll back status changes to appendixes 2
        await updateMany(
          appendix2Forms.map(f => f.id),
          { status: Status.AWAITING_GROUP }
        );
      }

      await transaction.event.create({
        data: {
          streamId: form.id,
          actor: user.id,
          type: "BsddDeleted",
          data: {},
          metadata: { ...logMetadata, authType: user.auth }
        }
      });
      return form;
    });

    await deleteBsd(deletedForm, { user } as GraphQLContext);
    return deletedForm;
  }

  function createTemporaryStorage(
    data: Prisma.TemporaryStorageDetailCreateInput
  ): Promise<TemporaryStorageDetail> {
    return dbClient.temporaryStorageDetail.create({
      data
    });
  }

  function count(where: Prisma.FormWhereInput): Promise<number> {
    return dbClient.form.count({ where });
  }

  return {
    findUnique,
    findFullFormById,
    findAppendix2FormsById,
    create,
    update,
    updateMany,
    delete: deleteForm,
    createTemporaryStorage,
    count
  };
}
