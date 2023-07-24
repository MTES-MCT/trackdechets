import { TransportMode, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateBsdaArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  siretify,
  userWithCompanyFactory,
  companyFactory,
  transporterReceiptFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

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
          siret
        }
        recepisse {
          isExempted
          number
          department
          validityLimit
        }
        transport {
          mode
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
        transport: {
          mode: TransportMode.AIR
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

    expect(data.updateBsda.transporter!.transport!.mode).toEqual(
      TransportMode.AIR
    );
  });

  it("should not allow the transporter to update the worker if already signed by the producer", async () => {
    const { company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: company2, user: user2 } = await userWithCompanyFactory(
      UserRole.ADMIN
    );

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerCompanySiret: company2.siret,
        destinationCompanySiret: company2.siret,
        transporterCompanySiret: company2.siret
      }
    });

    const { mutate } = makeClient(user2);

    const input = {
      worker: {
        company: {
          siret: company.siret
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : workerCompanySiret"
      })
    ]);
  });

  it("should update transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterCompanySiret: company.siret
      }
    });

    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const receipt = await transporterReceiptFactory({
      company: transporter
    });
    const { mutate } = makeClient(user);
    const input = {
      transporter: { company: { siret: transporter.siret } }
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

    expect(data.updateBsda.transporter!.company!.siret).toEqual(
      transporter.siret
    );
    // recepisse is pulled from db
    expect(data.updateBsda.transporter!.recepisse!.number).toEqual(
      receipt.receiptNumber
    );
    expect(data.updateBsda.transporter!.recepisse!.department).toEqual(
      receipt.department
    );
    expect(data.updateBsda.transporter!.recepisse!.validityLimit).toEqual(
      receipt.validityLimit.toISOString()
    );
    const transporter2 = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const receipt2 = await transporterReceiptFactory({
      company: transporter2,
      number: "other",
      department: "32"
    });
    const input2 = {
      transporter: { company: { siret: transporter2.siret } }
    };
    const { data: data2 } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: input2
      }
    });

    expect(data2.updateBsda.transporter!.company!.siret).toEqual(
      transporter2.siret
    );
    // recepisse2 is pulled from db
    expect(data2.updateBsda.transporter!.recepisse!.number).toEqual(
      receipt2.receiptNumber
    );
    expect(data2.updateBsda.transporter!.recepisse!.department).toEqual(
      receipt2.department
    );
    expect(data2.updateBsda.transporter!.recepisse!.validityLimit).toEqual(
      receipt2.validityLimit.toISOString()
    );
  });

  it("should void transporter recepisse if company has none", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // bsda has an associated receipt
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterCompanySiret: company.siret
      }
    });
    // transporter has no associated receipt
    const transporter = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    const { mutate } = makeClient(user);
    const input = {
      transporter: { company: { siret: transporter.siret } }
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

    expect(data.updateBsda.transporter!.company!.siret).toEqual(
      transporter.siret
    );
    // transporter has no receipt, then bsda recepisse is set to null
    expect(data.updateBsda.transporter!.recepisse).toEqual({
      department: null,
      isExempted: false,
      number: null,
      validityLimit: null
    });
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
      .findUniqueOrThrow({ where: { id: bsda.id } })
      .forwarding();

    expect(actualForwarded?.id).toEqual(newForwarded.id);
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
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.intermediaries!.length).toBe(1);
    expect(data.updateBsda.intermediaries![0].siret).toBe(otherCompany.siret);
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
    const { data } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(data.updateBsda.intermediaries!.length).toBe(1);
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

  it("should allow updating destination if the planned destination becomes the nextDestination", async () => {
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureAuthor: "Emit",
        workerWorkSignatureAuthor: "Work"
      }
    });

    const { mutate } = makeClient(transporter.user);

    const input = {
      destination: {
        company: {
          siret: transporter.company.siret
        },
        operation: {
          nextDestination: {
            company: { siret: destination.company.siret }
          }
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

    const updatedBsda = await prisma.bsda.findUnique({
      where: { id: data.updateBsda.id }
    });

    expect(updatedBsda?.destinationCompanySiret).toBe(
      transporter.company.siret
    );
    expect(updatedBsda?.destinationOperationNextDestinationCompanySiret).toBe(
      destination.company.siret
    );
  });

  it("should disallow updating destination if the planned destination disappears", async () => {
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        destinationCompanySiret: destination.company.siret,
        transporterCompanySiret: transporter.company.siret,
        emitterEmissionSignatureAuthor: "Emit",
        workerWorkSignatureAuthor: "Work"
      }
    });

    const { mutate } = makeClient(transporter.user);

    const input = {
      destination: {
        company: {
          siret: transporter.company.siret
        },
        operation: {
          nextDestination: {
            company: { siret: transporter.company.siret }
          }
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

    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe(
      "Impossible d'ajouter un intermédiaire d'entreposage provisoire sans indiquer la destination prévue initialement comme destination finale."
    );
  });

  it("should allow removing the nextDestination", async () => {
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        destinationCompanySiret: transporter.company.siret,
        transporterCompanySiret: transporter.company.siret,
        destinationOperationNextDestinationCompanySiret:
          destination.company.siret,
        emitterEmissionSignatureAuthor: "Emit",
        workerWorkSignatureAuthor: "Work"
      }
    });

    const { mutate } = makeClient(transporter.user);

    const input = {
      destination: {
        company: {
          siret: destination.company.siret
        },
        operation: {
          nextDestination: null
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

    const updatedBsda = await prisma.bsda.findUnique({
      where: { id: data.updateBsda.id }
    });

    expect(updatedBsda?.destinationCompanySiret).toBe(
      destination.company.siret
    );
    expect(updatedBsda?.destinationOperationNextDestinationCompanySiret).toBe(
      null
    );
  });

  it("if disabling the worker, worker certification data shoud be removed", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        workerCertificationHasSubSectionFour: true,
        workerCertificationHasSubSectionThree: true,
        workerCertificationCertificationNumber: "CERTIFICATION-NUMBER",
        workerCertificationValidityLimit: new Date(),
        workerCertificationOrganisation: "AFNOR Certification"
      }
    });

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          worker: {
            isDisabled: true,
            company: {
              name: null,
              siret: null
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();

    expect(data.updateBsda.id).toBeTruthy();

    const updatedBsda = await prisma.bsda.findUnique({
      where: { id: data.updateBsda.id }
    });

    expect(updatedBsda?.workerCompanyName).toBeNull();
    expect(updatedBsda?.workerCompanySiret).toBeNull();
    expect(updatedBsda?.workerCertificationHasSubSectionFour).toBe(false);
    expect(updatedBsda?.workerCertificationHasSubSectionThree).toBe(false);
    expect(updatedBsda?.workerCertificationCertificationNumber).toBeNull();
    expect(updatedBsda?.workerCertificationValidityLimit).toBeNull();
    expect(updatedBsda?.workerCertificationOrganisation).toBeNull();
  });
});
