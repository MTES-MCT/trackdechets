import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import * as sirenify from "../../../sirenify";

const sirenifyMock = jest
  .spyOn(sirenify, "default")
  .mockImplementation(input => Promise.resolve(input));

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
    sirenifyMock.mockClear();
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
    expect(sirenifyMock).toHaveBeenCalledTimes(1);
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
});
