import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateBsdaArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";
import * as sirenify from "../../../sirenify";

const sirenifyMock = jest
  .spyOn(sirenify, "default")
  .mockImplementation(input => Promise.resolve(input));

const UPDATE_BSDA = `
  mutation UpdateBsda($id: ID!, $input: BsdaInput!) {
    updateBsda(id: $id, input: $input) {
      id
      emitter {
        company {
          name
        }
      }
      waste {
        code
      }
      transporter {
        company {
          name
        }
        recepisse {
          number
        }
      }
      destination {
        company {
          name
        }
      }
      intermediaries {
        siret
      }
    }
  }
`;

describe("Mutation.updateBsda", () => {
  afterEach(async () => {
    await resetDatabase();
    sirenifyMock.mockClear();
  });

  it("should allow user to update a bsda", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(data.updateBsda.id).toBeTruthy();
    // check input is sirenified
    expect(sirenifyMock).toHaveBeenCalledTimes(1);
  });

  it("should disallow unauthenticated user from updating a bsda", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsda", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {}
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
      })
    ]);
  });

  it("should throw an error if the bsda being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "123" n'existe pas.`
      })
    ]);
  });

  it("should throw an error if the bsda being updated is deleted", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          emitter: {
            company: {
              name: company.name
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau avec l'identifiant "${bsda.id}" n'existe pas.`
      })
    ]);
  });

  it("should disallow removing a company from the bsda", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          emitter: {
            company: {
              siret: siretify(4)
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas enlever votre établissement du bordereau"
      })
    ]);
  });

  it("should allow updating emitter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda).toEqual(expect.objectContaining(input));
  });

  it("should not update emitter if they signed already", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        destinationCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      emitter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : emitterCompanyName"
      })
    ]);
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      transporter: {
        recepisse: {
          number: "Num recepisse"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.transporter.recepisse.number).toEqual(
      "Num recepisse"
    );
  });

  it("should not update transporter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          name: "Another name"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : transporterCompanyName"
      })
    ]);
  });

  it("should update the list of grouped bsdas", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const associatedBsda = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });
    const bsdaToGroup = await bsdaFactory({
      opt: {
        type: "RESHIPMENT",
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: destination.company.siret,
        grouping: { connect: [{ id: associatedBsda.id }] }
      }
    });

    const { mutate } = makeClient(destination.user);
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          grouping: [bsdaToGroup.id]
        }
      }
    });

    const groupedBsdas = await prisma.bsda
      .findUnique({ where: { id: data.updateBsda.id } })
      .grouping();
    expect(groupedBsdas).toEqual([
      expect.objectContaining({
        id: bsdaToGroup.id
      })
    ]);
  });

  it("should update the forwarded BSDA", async () => {
    const ttr = await userWithCompanyFactory(UserRole.ADMIN);
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const oldForwarded = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL",
        emitterCompanySiret: ttr.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15",
        forwarding: { connect: { id: oldForwarded.id } }
      }
    });

    const newForwarded = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: ttr.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });

    const { mutate } = makeClient(ttr.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          forwarding: newForwarded.id
        }
      }
    });

    expect(errors).toBeUndefined();

    const actualForwarded = await prisma.bsda
      .findUnique({ where: { id: bsda.id } })
      .forwarding();

    expect(actualForwarded.id).toEqual(newForwarded.id);
  });

  it("should ignore grouping if the bsdas ids order has changed", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const associatedBsda1 = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });
    const associatedBsda2 = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationCode: "D 15"
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: destination.company.siret,
        emitterEmissionSignatureDate: new Date().toISOString(),
        grouping: {
          connect: [{ id: associatedBsda1.id }, { id: associatedBsda2.id }]
        }
      }
    });

    // The bsda is SENT. The grouping field is not updatable anymore.
    // But the value we pass should be ignored as it's the current bsda value.

    // order 1
    const { mutate } = makeClient(destination.user);
    const { errors: errrors1 } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          grouping: [associatedBsda1.id, associatedBsda2.id]
        }
      }
    });
    expect(errrors1).toBeUndefined();

    // inverse order
    const { errors: errrors2 } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          grouping: [associatedBsda2.id, associatedBsda1.id]
        }
      }
    });
    expect(errrors2).toBeUndefined();
  });

  it("should allow updating intermediaries", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: {
            siret: company.siret,
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
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.intermediaries.length).toBe(1);
    expect(data.updateBsda.intermediaries[0].siret).toBe(otherCompany.siret);
  });

  it("should ignore intermediaries update if the value hasn't changed", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT", // Bsda is sent => intermediaries cannot be updated anymore
        transporterTransportSignatureDate: new Date(),
        intermediaries: {
          create: {
            siret: company.siret,
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
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.intermediaries.length).toBe(1);
  });

  it("should reject if updating intermediaries when its value is locked", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT", // Bsda is sent => intermediaries cannot be updated anymore
        transporterTransportSignatureDate: new Date(),
        intermediaries: {
          create: {
            siret: company.siret,
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
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : intermediaries"
    );
  });
});
