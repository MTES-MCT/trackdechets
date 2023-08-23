import { Prisma } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userFactory
} from "../../../__tests__/factories";
import { expandFormFromDb, expandableFormIncludes } from "../../converter";
import getReadableId from "../../readableId";
import { formDiff } from "../diff";
import { getFirstTransporterSync } from "../../database";

describe("formDiff", () => {
  afterAll(resetDatabase);

  it("should return an empty object if no change are recorded", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const diff = formDiff(fullForm, form as any);
    expect(diff).toEqual({});
  });

  it("should calculate diff between two different forms", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const formUpdateInput: Prisma.FormUpdateInput = {
      emitterCompanyName: "Updated name", // nested field
      sentBy: "Mr Sender" // shallow field
    };
    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: formUpdateInput
    });
    const diff = formDiff(fullForm, updatedForm as any);
    expect(diff).toEqual({
      emitter: { company: { name: formUpdateInput.emitterCompanyName } },
      sentBy: formUpdateInput.sentBy
    });
  });

  it("should calculate diff on temporary storage detail", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({ ownerId: user.id });
    const { forwardedIn, ...fullForm } = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: {
        transporters: true,
        forwardedIn: { include: { transporters: true } }
      }
    });

    const forwardedInTransporter = getFirstTransporterSync(forwardedIn!);

    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: {
          transporters: {
            update: {
              data: {
                transporterCompanyName: "New Transporter"
              },
              where: { id: forwardedInTransporter!.id }
            }
          }
        }
      }
    };
    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: formUpdateInput
    });
    const updatedForwardedIn = await prisma.form
      .findUnique({ where: { id: form.id } })
      .forwardedIn();

    const diff = formDiff({ ...fullForm, forwardedIn }, {
      ...updatedForm,
      forwardedIn: updatedForwardedIn
    } as any);
    expect(diff).toEqual({
      temporaryStorageDetail: {
        transporter: {
          company: {
            name: "New Transporter"
          }
        }
      }
    });
  });

  it("should calculate diff on temporary storage detail if no initial temp storage", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: expandableFormIncludes
    });
    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        create: {
          readableId: getReadableId(),
          owner: { connect: { id: user.id } },
          recipientCompanySiret: siretify(1)
        }
      }
    };
    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: formUpdateInput,
      include: { forwardedIn: true }
    });
    const diff = formDiff(fullForm, updatedForm as any);

    const expected = {
      temporaryStorageDetail: await expandFormFromDb(
        updatedForm.forwardedIn! as any
      )
    };
    expect(diff).toEqual(expected);
  });
});
