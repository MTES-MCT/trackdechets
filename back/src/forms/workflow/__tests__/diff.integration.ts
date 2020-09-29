import { FormUpdateInput, prisma } from "../../../generated/prisma-client";
import {
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  tempStorageData
} from "../../../__tests__/factories";
import { expandTemporaryStorageFromDb } from "../../form-converter";
import { formDiff } from "../diff";

describe(formDiff, () => {
  it("should return an empty object if no change are recorded", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const diff = formDiff(form, form);
    expect(diff).toEqual({});
  });

  it("should calculate diff between two different forms", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const formUpdateInput: FormUpdateInput = {
      emitterCompanyName: "Updated name", // nested field
      sentBy: "Mr Sender" // shallow field
    };
    const updatedForm = await prisma.updateForm({
      where: { id: form.id },
      data: formUpdateInput
    });
    const diff = formDiff(form, updatedForm);
    expect(diff).toEqual({
      emitter: { company: { name: formUpdateInput.emitterCompanyName } },
      sentBy: formUpdateInput.sentBy
    });
  });

  it("should calculate diff on temporary storage detail", async () => {
    const user = await userFactory();
    const form = await formWithTempStorageFactory({ ownerId: user.id });
    const temporaryStorageDetail = await prisma
      .form({ id: form.id })
      .temporaryStorageDetail();
    const formUpdateInput: FormUpdateInput = {
      temporaryStorageDetail: {
        update: {
          transporterCompanyName: "New Transporter"
        }
      }
    };
    const updatedForm = await prisma.updateForm({
      where: { id: form.id },
      data: formUpdateInput
    });
    const updatedTemporaryStorageDetail = await prisma
      .form({ id: form.id })
      .temporaryStorageDetail();

    const diff = formDiff(
      { ...form, temporaryStorageDetail },
      { ...updatedForm, temporaryStorageDetail: updatedTemporaryStorageDetail }
    );
    expect(diff).toEqual({
      temporaryStorageDetail: {
        transporter: {
          company: {
            name:
              formUpdateInput.temporaryStorageDetail.update
                .transporterCompanyName
          }
        }
      }
    });
  });

  it("should calculate diff on temporary storage detail if no initial temp storage", async () => {
    const user = await userFactory();
    const form = await formFactory({ ownerId: user.id });
    const temporaryStorageDetail = await prisma
      .form({ id: form.id })
      .temporaryStorageDetail();
    const formUpdateInput: FormUpdateInput = {
      temporaryStorageDetail: {
        create: tempStorageData
      }
    };
    const updatedForm = await prisma.updateForm({
      where: { id: form.id },
      data: formUpdateInput
    });
    const updatedTemporaryStorageDetail = await prisma
      .form({ id: form.id })
      .temporaryStorageDetail();
    const diff = formDiff(
      { ...form, temporaryStorageDetail },
      { ...updatedForm, temporaryStorageDetail: updatedTemporaryStorageDetail }
    );

    const expected = {
      temporaryStorageDetail: expandTemporaryStorageFromDb(
        updatedTemporaryStorageDetail
      )
    };
    expect(diff).toEqual(expected);
  });
});
