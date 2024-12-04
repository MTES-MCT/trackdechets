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
import { prisma } from "@td/prisma";
import gql from "graphql-tag";
import { BsvhuIdentificationType } from "@prisma/client";

const UPDATE_VHU_FORM = gql`
  mutation EditVhuForm($id: ID!, $input: BsvhuInput!) {
    updateBsvhu(id: $id, input: $input) {
      id
      isDraft
      packaging
      identification {
        type
      }
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
        message: "Votre établissement doit être visé sur le bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow user to update a draft BSVHU", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      quantity: 4
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );
    expect(errors).toBeUndefined();
    const updatedBsvhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: bsvhu.id }
    });
    expect(updatedBsvhu.quantity).toEqual(4);
  });

  it("should allow user to update a draft BSVHU customId", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      customId: "the custom id"
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );
    expect(errors).toBeUndefined();
    const updatedBsvhu = await prisma.bsvhu.findFirstOrThrow({
      where: { id: bsvhu.id }
    });
    expect(updatedBsvhu.customId).toEqual("the custom id");
  });

  it("should disallow user who isn't part of the creator's companies to update a draft BSVHU", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: company2, user: user2 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: ["TRANSPORTER"]
      }
    );
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret,
        transporterCompanySiret: company2.siret
      }
    });
    const { mutate } = makeClient(user2);
    const input = {
      weight: {
        value: 4
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Votre établissement doit être visé sur le bordereau",
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

  it("should fail when deprecated identificationType is used", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_LOTS_SORTANTS"
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : La valeur du type d'identification est dépréciée",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should success when deprecated identificationType is used on a bsvhu create before release date", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        createdAt: new Date("2024-01-01:00:00.000Z"), // before v20241201
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const input = {
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_LOTS_SORTANTS"
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(data.updateBsvhu.packaging).toEqual("UNITE");
    expect(data.updateBsvhu.identification?.type).toEqual(
      "NUMERO_ORDRE_LOTS_SORTANTS"
    );
  });

  it("should fail when packaging is LOT and identificationType is not null", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "LOT",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : Le type d'identification doit être null quand le conditionnement est en lot",

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should succeed when packaging is LOT and identificationType is not null on a bsvhu created before release date", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        createdAt: new Date("2024-01-01:00:00.000Z"), // before v20241201
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "LOT",
      identification: {
        numbers: ["123", "456"],
        type: "NUMERO_ORDRE_REGISTRE_POLICE"
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(data.updateBsvhu.packaging).toEqual("LOT");
    expect(data.updateBsvhu.identification?.type).toEqual(
      "NUMERO_ORDRE_REGISTRE_POLICE"
    );
  });

  it("should succeed when packaging is LOT and identificationType is null", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "LOT",
      identification: {
        numbers: ["123", "456"],
        type: null
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(data.updateBsvhu.packaging).toEqual("LOT");
    expect(data.updateBsvhu.identification?.type).toEqual(null);
  });

  it("should fail when packaging is UNITE and identificationType is null", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: null
      }
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "identificationType : Le type d'identification est obligatoire quand le conditionnement est en unité",

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should succed when packaging is UNITE and identificationType is null on a bsvhu created before release date", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsvhu = await bsvhuFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
        emitterCompanySiret: company.siret,
        createdAt: new Date("2024-01-01:00:00.000Z") // before v20241201
      }
    });
    const { mutate } = makeClient(user);
    const input = {
      packaging: "UNITE",
      identification: {
        numbers: ["123", "456"],
        type: null
      }
    };
    const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
      UPDATE_VHU_FORM,
      {
        variables: { id: bsvhu.id, input }
      }
    );

    expect(data.updateBsvhu.packaging).toEqual("UNITE");
    expect(data.updateBsvhu.identification?.type).toEqual(null);
  });

  it.each([
    BsvhuIdentificationType.NUMERO_ORDRE_REGISTRE_POLICE,
    BsvhuIdentificationType.NUMERO_IMMATRICULATION
  ])(
    "should succed when packaging is UNITE and identificationType is %p",
    async identificationType => {
      const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
      const bsvhu = await bsvhuFactory({
        userId: user.id,
        opt: {
          isDraft: true,
          status: "INITIAL",
          emitterCompanySiret: company.siret
        }
      });
      const { mutate } = makeClient(user);
      const input = {
        packaging: "UNITE",
        identification: {
          numbers: ["123", "456"],
          type: identificationType
        }
      };
      const { data } = await mutate<Pick<Mutation, "updateBsvhu">>(
        UPDATE_VHU_FORM,
        {
          variables: { id: bsvhu.id, input }
        }
      );

      expect(data.updateBsvhu.packaging).toEqual("UNITE");
      expect(data.updateBsvhu.identification?.type).toEqual(identificationType);
    }
  );
});
