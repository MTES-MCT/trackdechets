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
import { UserRole } from "@prisma/client";
import gql from "graphql-tag";

const UPDATE_VHU_FORM = gql`
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
          isExempted
        }
      }
      intermediaries {
        siret
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Le N° d'agrément de l'émetteur",
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
    expect(data.updateBsvhu.transporter!.recepisse).toEqual({
      department: null,
      number: null,
      validityLimit: null,
      isExempted: false
    });
  });

  it("should allow updating intermediaries", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: {
            siret: company.siret!,
            name: company.name,
            address: company.address,
            contact: "John Doe"
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      intermediaries: [
        {
          siret: otherCompany.siret,
          name: otherCompany.name,
          address: otherCompany.address,
          contact: "John Doe"
        }
      ]
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(data.updateBsvhu.intermediaries!.length).toBe(1);
    expect(data.updateBsvhu.intermediaries![0].siret).toBe(otherCompany.siret);
  });

  it("should ignore intermediaries update if the value hasn't changed", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterTransportSignatureDate: new Date(),
        intermediaries: {
          create: {
            siret: company.siret!,
            name: company.name,
            address: company.address,
            contact: "John Doe"
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    // We pass an update with the same value as before.
    // Even if the field is locked, this should be ignored
    const input = {
      intermediaries: [
        {
          siret: company.siret,
          name: company.name,
          address: company.address,
          contact: "John Doe"
        }
      ]
    };
    const { data, errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(errors).toBeUndefined();

    expect(data.updateBsvhu.intermediaries!.length).toBe(1);
  });

  it("should reject if updating intermediaries when its value is locked", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );

    const bsvhu = await bsvhuFactory({
      opt: {
        destinationCompanySiret: company.siret,
        transporterTransportSignatureDate: new Date(),
        intermediaries: {
          create: {
            siret: company.siret!,
            name: company.name,
            address: company.address,
            contact: "John Doe"
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    // We pass an update with the same value as before.
    // Even if the field is locked, this should be ignored
    const input = {
      intermediaries: [
        {
          siret: otherCompany.siret,
          name: otherCompany.name,
          address: otherCompany.address,
          contact: "John Doe"
        }
      ]
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
        "Les intermédiaires"
    );
  });
});
