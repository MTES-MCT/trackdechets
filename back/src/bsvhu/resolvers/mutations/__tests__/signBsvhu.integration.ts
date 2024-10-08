import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { Mutation } from "../../../../generated/graphql/types";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import { companyFactory } from "../../../../__tests__/factories";

const SIGN_VHU_FORM = `
mutation SignVhuForm($id: ID!, $input: BsvhuSignatureInput!) {
  signBsvhu(id: $id, input: $input) {
      id
      emitter {
        emission {
          signature {
            author
            date
          }
        }
      }
      transporter {
        transport {
          signature {
            author
            date
          }
        }
      }
  }
}
`;

describe("Mutation.Vhu.sign", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(SIGN_VHU_FORM, {
      variables: {
        id: 1,
        input: { type: "EMISSION", author: "The Ghost" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should set a default signature date if none is given", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU_FORM, {
      variables: {
        id: bsvhu.id,
        input: { type: "EMISSION", author: user.name }
      }
    });

    expect(data.signBsvhu.emitter!.emission!.signature!.author).toBe(user.name);
    expect(data.signBsvhu.emitter!.emission!.signature!.date).not.toBeNull();
  });

  it("should use the provided date for the signature if  given", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const date = new Date().toISOString();
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU_FORM, {
      variables: {
        id: bsvhu.id,
        input: { type: "EMISSION", author: user.name, date }
      }
    });

    expect(data.signBsvhu.emitter!.emission!.signature!.author).toBe(user.name);
    expect(data.signBsvhu.emitter!.emission!.signature!.date).toBe(date);
  });

  it("should require emitter signature if the emitter is on TD and situation is not irregular", async () => {
    const emitterCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanySiret: company.siret,
        transporterRecepisseIsExempted: true
      }
    });

    const date = new Date().toISOString();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(
      SIGN_VHU_FORM,
      {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas apposer cette signature sur le bordereau.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should require emitter signature if the emitter is on TD and situation is irregular", async () => {
    const emitterCompany = await companyFactory();
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterIrregularSituation: true,
        emitterCompanySiret: emitterCompany.siret,
        transporterCompanySiret: company.siret,
        transporterRecepisseIsExempted: true
      }
    });

    const date = new Date().toISOString();
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "signBsvhu">>(
      SIGN_VHU_FORM,
      {
        variables: {
          id: bsvhu.id,
          input: { type: "TRANSPORT", author: user.name, date }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas apposer cette signature sur le bordereau.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should not require emitter signature if the emitter is not on TD and situation is irregular", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterIrregularSituation: true,
        emitterCompanySiret: siretify(45345),
        transporterCompanySiret: company.siret,
        transporterRecepisseIsExempted: true
      }
    });

    const date = new Date().toISOString();
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU_FORM, {
      variables: {
        id: bsvhu.id,
        input: { type: "TRANSPORT", author: user.name, date }
      }
    });
    expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
      user.name
    );
    expect(data.signBsvhu.transporter!.transport!.signature!.date).toBe(date);
  });

  it("should not require emitter signature if the emitter doesn't have a SIRET and situation is irregular", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: ["TRANSPORTER"]
    });

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterIrregularSituation: true,
        emitterNoSiret: true,
        emitterCompanySiret: null,
        transporterCompanySiret: company.siret,
        transporterRecepisseIsExempted: true
      }
    });

    const date = new Date().toISOString();
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "signBsvhu">>(SIGN_VHU_FORM, {
      variables: {
        id: bsvhu.id,
        input: { type: "TRANSPORT", author: user.name, date }
      }
    });

    expect(data.signBsvhu.transporter!.transport!.signature!.author).toBe(
      user.name
    );
    expect(data.signBsvhu.transporter!.transport!.signature!.date).toBe(date);
  });
});