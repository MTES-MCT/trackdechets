import { PrismaClient } from "@prisma/client";

const xprisma = new PrismaClient().$extends({
  query: {
    form: {
      async findMany({ model, operation, args, query }) {
        args.where = { ...args.where, isDeleted: false };
        return query(args);
      }
    }
  }
});

type XPrismaClient = typeof xprisma;

function Forms(prismaForm: XPrismaClient["form"]) {
  return Object.assign(prismaForm, {});
}

const Form = Forms(xprisma.form);

export default xprisma;

export { Form };
