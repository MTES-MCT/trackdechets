import { Prisma } from "@prisma/client";
import { resetDatabase } from "../../../../integration-tests/helper";
import prisma from "../../../prisma";
import {
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userFactory
} from "../../../__tests__/factories";
import { expandFormFromDb } from "../../converter";
import getReadableId from "../../readableId";
import { formDiff } from "../diff";

describe("formDiff", () => {
  afterAll(resetDatabase);

  it("should return an empty object if no change are recorded", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const diff = await formDiff(form, form);
    expect(diff).toEqual({});
  });

  it("should calculate diff between two different forms", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const formUpdateInput: Prisma.FormUpdateInput = {
      emitterCompanyName: "Updated name", // nested field
      sentBy: "Mr Sender" // shallow field
    };
    const updatedForm = await prisma.form.update({
      where: { id: form.id },
      data: formUpdateInput
    });
    const diff = await formDiff(form, updatedForm);
    expect(diff).toEqual({
      emitter: { company: { name: formUpdateInput.emitterCompanyName } },
      sentBy: formUpdateInput.sentBy
    });
  });

  it("should calculate diff on temporary storage detail", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({ ownerId: user.id });
    const forwardedIn = await prisma.form
      .findUnique({ where: { id: form.id } })
      .forwardedIn();
    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: {
          transporterCompanyName: "New Transporter"
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

    const diff = await formDiff(
      { ...form, forwardedIn },
      { ...updatedForm, forwardedIn: updatedForwardedIn }
    );
    expect(diff).toEqual({
      temporaryStorageDetail: {
        transporter: {
          company: {
            name: formUpdateInput.forwardedIn.update.transporterCompanyName
          }
        }
      }
    });
  });

  it("should calculate diff on temporary storage detail if no initial temp storage", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
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
    const diff = await formDiff(form, updatedForm);

    const expected = {
      temporaryStorageDetail: await expandFormFromDb(updatedForm.forwardedIn)
    };
    expect(diff).toEqual(expected);
  });
});
