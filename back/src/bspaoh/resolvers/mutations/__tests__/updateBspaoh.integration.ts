import { TransportMode, UserRole, BspaohStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateBspaohArgs
} from "../../../../generated/graphql/types";
import {
  siretify,
  userWithCompanyFactory,
  companyFactory,
  transporterReceiptFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";
import { fullBspaoh } from "../../../fragments";
import { gql } from "graphql-tag";
import prisma from "../../../../prisma";
import { sirenify as sirenifyBspaohInput } from "../../../validation/sirenify";

jest.mock("../../../validation/sirenify");
(sirenifyBspaohInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

const UPDATE_BSPAOH = gql`
  mutation UpdateBspaoh($id: ID!, $input: BspaohInput!) {
    updateBspaoh(id: $id, input: $input) {
      ...FullBspaoh
    }
  }
  ${fullBspaoh}
`;

describe("Mutation.updateBspaoh", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyBspaohInput as jest.Mock).mockClear();
  });

  it("should allow user to update a bspaoh", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input: {
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });

    expect(data.updateBspaoh.id).toBeTruthy();

    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it("should disallow unauthenticated user from updating a bspaoh", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bspaoh", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {}
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
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

  it("should disallow user who is not the creator on a draft bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: ["1234"]
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input: { emitter: { customInfo: "plop" } }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
      })
    ]);
  });

  it("should allow user who is the creator on a draft bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input: {
          emitter: { customInfo: "info custom" }
        }
      }
    });
    expect(data.updateBspaoh?.emitter?.customInfo).toEqual("info custom");
  });

  it("should update denormalized canAccessDraftSirets", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await companyAssociatedToExistingUserFactory(
      user,
      UserRole.MEMBER
    );
    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: [company.siret as string]
      }
    });

    expect(bspaoh.canAccessDraftSirets).toEqual([company.siret]);
    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id,
          input: {
            destination: { company: { siret: destination.siret } }
          }
        }
      }
    );
    const updated = await prisma.bspaoh.findUnique({
      where: { id: bspaoh.id }
    });
    expect(updated?.canAccessDraftSirets).toEqual([
      company.siret,
      destination.siret
    ]);
  });

  it("should update denormalized transporterTransportTakenOverAt", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);

    await mutate<Pick<Mutation, "updateBspaoh">, MutationUpdateBspaohArgs>(
      UPDATE_BSPAOH,
      {
        variables: {
          id: bspaoh.id,
          input: {
            transporter: {
              transport: {
                takenOverAt: "2023-12-03T15:44:00"
              }
            }
          }
        }
      }
    );

    const updated = await prisma.bspaoh.findUnique({
      where: { id: bspaoh.id }
    });
    // takenOverAt is denormalized on transporterTransportTakenOverAt
    expect(updated?.transporterTransportTakenOverAt).toEqual(
      new Date("2023-12-03T15:44:00")
    );
  });

  it("should throw an error if the bspaoh being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
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

  it("should throw an error if the bspaoh being updated is deleted", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
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
        message: `Le bordereau avec l'identifiant "${bspaoh.id}" n'existe pas.`
      })
    ]);
  });

  it("should disallow removing a company from the bspaoh", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
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
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      emitter: {
        company: {
          phone: "0612345678"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(data.updateBspaoh?.emitter?.company?.phone).toEqual("0612345678");
  });

  it("should not update emitter if they signed already", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
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
          phone: "0612345678"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le téléphone de l'entreprise émettrice a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow emitter to update destination when he is the only one to have signed", async () => {
    const { company: emitter, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();

    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      destination: {
        company: {
          siret: destination2.siret
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should not allow emitter to update destination if the transporter has signed", async () => {
    const { company: emitter, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();
    const transporter = await companyFactory();

    const bspaoh = await bspaohFactory({
      opt: {
        status: "SENT",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,

        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    const input = {
      destination: {
        company: {
          siret: destination2.siret
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le SIRET de l'entreprise de destination a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const transporterCompany = await companyFactory({
      companyTypes: ["TRANSPORTER"]
    });
    await transporterReceiptFactory({ company: transporterCompany });
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    // sanity check
    expect(bspaoh.transporters[0].transporterTransportSignatureDate).toBe(null);
    const created = await prisma.bspaoh.findUnique({
      where: { id: bspaoh.id },
      include: { transporters: true }
    });
    expect(created?.transportersSirets).toEqual([
      bspaoh.transporters[0].transporterCompanySiret
    ]);

    const { mutate } = makeClient(user);

    const input = {
      transporter: {
        company: {
          siret: transporterCompany.siret,
          name: "transporter",
          contact: "jean valjean",
          phone: "123",
          mail: "emitter@test.fr",
          address: "rue jean jaures toulon"
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(data.updateBspaoh.transporter!.company!.siret).toEqual(
      transporterCompany.siret
    );
    expect(data.updateBspaoh.transporter!.recepisse!.number).toEqual(
      "the number"
    );
    expect(data.updateBspaoh.transporter!.recepisse!.department).toEqual("83");
    expect(data.updateBspaoh.transporter!.recepisse!.validityLimit).toEqual(
      "2055-01-01T00:00:00.000Z"
    );

    const updated = await prisma.bspaoh.findUnique({
      where: { id: bspaoh.id },
      include: { transporters: true }
    });
    // denormalize `transportersSirets` is updated
    expect(updated?.transportersSirets).toEqual([transporterCompany.siret]);
  });

  it("should allow updating transport data if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });
    // sanity check
    expect(bspaoh.transporters[0].transporterTransportSignatureDate).toBe(null);

    const { mutate } = makeClient(user);

    const input = {
      transporter: {
        transport: {
          mode: TransportMode.AIR
        }
      }
    };
    const { data } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(data.updateBspaoh.transporter!.transport!.mode).toEqual(
      TransportMode.AIR
    );
  });
  it("should not allow the transporter to update the producer if already signed by the producer", async () => {
    const { company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: company2, user: user2 } = await userWithCompanyFactory(
      UserRole.ADMIN
    );

    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterCompanySiret: company2.siret,

            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(user2);

    const input = {
      emitter: {
        company: {
          siret: company2.siret
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le SIRET de l'entreprise émettrice a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should update transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
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
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(data.updateBspaoh.transporter!.company!.siret).toEqual(
      transporter.siret
    );
    // recepisse is pulled from db
    expect(data.updateBspaoh.transporter!.recepisse!.number).toEqual(
      receipt.receiptNumber
    );

    expect(data.updateBspaoh.transporter!.recepisse!.department).toEqual(
      receipt.department
    );
    expect(data.updateBspaoh.transporter!.recepisse!.validityLimit).toEqual(
      receipt.validityLimit.toISOString()
    );
    // check input is sirenified
    expect(sirenifyBspaohInput as jest.Mock).toHaveBeenCalledTimes(1);
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
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input: input2
      }
    });

    expect(data2.updateBspaoh.transporter!.company!.siret).toEqual(
      transporter2.siret
    );
    // recepisse2 is pulled from db
    expect(data2.updateBspaoh.transporter!.recepisse!.number).toEqual(
      receipt2.receiptNumber
    );
    expect(data2.updateBspaoh.transporter!.recepisse!.department).toEqual(
      receipt2.department
    );
    expect(data2.updateBspaoh.transporter!.recepisse!.validityLimit).toEqual(
      receipt2.validityLimit.toISOString()
    );
  });

  it("should void transporter recepisse if company has none", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // bspaoh has an associated receipt
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporters: {
          create: {
            transporterCompanySiret: company.siret,
            number: 1
          }
        }
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
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(data.updateBspaoh.transporter!.company!.siret).toEqual(
      transporter.siret
    );
    // transporter has no receipt, then bspaoh recepisse is set to null
    expect(data.updateBspaoh.transporter!.recepisse).toEqual({
      department: null,
      isExempted: false,
      number: null,
      validityLimit: null
    });
  });

  it("should not update transporter if they signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        company: {
          phone: "0612345678"
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le téléphone du transporteur a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should not update transporter field if transporter already signed already", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const bspaoh = await bspaohFactory({
      opt: {
        status: "SENT",
        emitterCompanySiret: emitter.company.siret,
        emitterEmissionSignatureDate: new Date(),

        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterTransportSignatureDate: new Date(),
            transporterTakenOverAt: new Date(),
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input = {
      transporter: {
        transport: {
          mode: TransportMode.AIR
        }
      }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBspaoh">,
      MutationUpdateBspaohArgs
    >(UPDATE_BSPAOH, {
      variables: {
        id: bspaoh.id,
        input
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le mode de transport a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });
});
