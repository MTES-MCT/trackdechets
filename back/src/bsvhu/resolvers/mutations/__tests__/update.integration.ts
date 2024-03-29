import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { sirenify } from "../../../sirenify";

jest.mock("../../../sirenify");
(sirenify as jest.Mock).mockImplementation(input => Promise.resolve(input));

const UPDATE_VHU_FORM = `
mutation EditVhuForm($id: ID!, $input: BsvhuInput!) {
  updateBsvhu(id: $id, input: $input) {
    id
    isDraft
    destination {
      company {
        siret
      }
    }
    emitter {
      agrementNumber
      company {
        siret
      }
    }
    transporter {
      company {
        siret
        name
        address
        contact
        mail
        phone
        vatNumber
      }
      recepisse {
        number
        department
        validityLimit
      }
    }
    weight {
      value
    }
  }
}
`;

describe("Mutation.Vhu.update", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenify as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: 1, input: {} }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should disallow a user to update a form they are not part of", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const connectedUser = await userFactory();
    const { mutate } = makeClient(connectedUser);
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: {
          id: form.id,
          input: {
            quantity: 4
          }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should be possible to update a non signed form", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      weight: {
        value: 4
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    expect(data.updateBsvhu.weight!.value).toBe(4);
    // check input is sirenified
    expect(sirenify).toHaveBeenCalledTimes(1);
  });

  it("should allow emitter fields update before emitter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      emitter: {
        agrementNumber: "new agrement"
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    expect(data.updateBsvhu.emitter!.agrementNumber).toBe("new agrement");
  });

  it("should disallow emitter fields update after emitter signature", async () => {
    const emitter = await companyFactory();
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await bsvhuFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: emitter.siret,
        destinationCompanySiret: destination.company.siret,
        emitterEmissionSignatureAuthor: "The Signatory",
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(destination.user);
    const input = {
      emitter: {
        agrementNumber: "new agrement"
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterAgrementNumber",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow transporter fields update after emitter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const foreignTransporter = await companyFactory({
      companyTypes: ["TRANSPORTER"],
      orgId: "NL004983269B01",
      vatNumber: "NL004983269B01"
    });
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureAuthor: "The Signatory",
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        company: { vatNumber: foreignTransporter.vatNumber }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    expect(data.updateBsvhu.transporter!.company!.vatNumber).toBe(
      foreignTransporter.vatNumber
    );
  });

  it("should update transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({
      company: transporter
    });
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureAuthor: "The Signatory",
        emitterEmissionSignatureDate: new Date(),
        transporterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        company: { siret: transporter.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    // recepisse is pulled from db
    expect(data.updateBsvhu.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.updateBsvhu.transporter!.recepisse!.department).toEqual("83");
    expect(data.updateBsvhu.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );
  });

  it("should empty transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // no associated receipt
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const form = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureAuthor: "The Signatory",
        emitterEmissionSignatureDate: new Date(),
        transporterCompanySiret: company.siret,
        transporterRecepisseNumber: "xyz",
        transporterRecepisseDepartment: "13",
        transporterRecepisseValidityLimit: new Date()
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      transporter: {
        company: { siret: transporter.siret }
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: form.id, input }
      }
    );

    // recepisse is pulled from db
    expect(data.updateBsvhu.transporter!.recepisse).toEqual(null);
  });
});
