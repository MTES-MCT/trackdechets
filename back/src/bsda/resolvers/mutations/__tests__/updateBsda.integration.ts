import {
  Bsda,
  BsdaStatus,
  TransportMode,
  Prisma,
  UserRole
} from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type {
  BsdaInput,
  Mutation,
  MutationUpdateBsdaArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  siretify,
  userWithCompanyFactory,
  companyFactory,
  transporterReceiptFactory,
  ecoOrganismeFactory,
  userInCompany
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  bsdaFactory,
  bsdaTransporterFactory
} from "../../../__tests__/factories";
import { getFirstTransporter, getTransportersSync } from "../../../database";
import { getStream } from "../../../../activity-events";
import {
  producerShouldBeNotifiedOfDestinationCapModification,
  sendDestinationCapModificationMail
} from "../update";
import { sendMail } from "../../../../mailer/mailing";
import gql from "graphql-tag";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

export const UPDATE_BSDA = gql`
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
        reception {
          weight
          refusedWeight
          acceptedWeight
          acceptationStatus
        }
      }
      intermediaries {
        siret
      }
    }
  }
`;

describe("Mutation.updateBsda", () => {
  afterAll(resetDatabase);

  it("should allow user to update a bsda", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
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
          emitter: {
            company: {
              name: "New Name"
            }
          }
        }
      }
    });
    expect(errors).toBeUndefined();

    expect(data.updateBsda.id).toBeTruthy();
  });

  it("should allow user to update a draft BSDA", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
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
          waste: { materialName: "new name" }
        }
      }
    });

    expect(errors).toBeUndefined();
    const updatedBsda = await prisma.bsda.findFirstOrThrow({
      where: { id: bsda.id }
    });
    expect(updatedBsda.wasteMaterialName).toEqual("new name");
  });

  it("should fail if plate numbers are invalid ", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      userId: user.id,
      opt: {
        isDraft: true,
        status: "INITIAL",
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
          transporter: { transport: { plates: ["AZ"] } }
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le numéro d'immatriculation doit faire entre 4 et 12 caractères"
      })
    ]);
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
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : Le nom de l'entreprise émettrice a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow emitter to update destination when he is the only one to have signed", async () => {
    const { company: emitter, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();

    const bsda = await bsdaFactory({
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
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should not allow emitter to update destination if the worker has signed", async () => {
    const { company: emitter, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();
    const worker = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,
        workerCompanySiret: worker.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "Le SIRET de l'entreprise de destination a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should not allow emitter to update destination if the transporter has signed", async () => {
    const { company: emitter, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();
    const transporter = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret,
        transporterTransportSignatureDate: new Date()
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "Le SIRET de l'entreprise de destination a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow worker to update waste info", async () => {
    const { company: worker, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const emitter = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,
        workerCompanySiret: worker.siret,
        emitterEmissionSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(user);

    const input: BsdaInput = {
      waste: {
        materialName: "Fibrociment",
        familyCode: "code famille",
        sealNumbers: ["1", "2"],
        adr: "ADR"
      },
      weight: { value: 1, isEstimate: false },
      packagings: [{ type: "BIG_BAG", quantity: 1 }]
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

    expect(errors).toBeUndefined();
  });

  it("should not allow worker to update destination after emitter's signature", async () => {
    const { company: worker, user } = await userWithCompanyFactory("ADMIN");
    const destination = await companyFactory();
    const destination2 = await companyFactory();
    const emitter = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        destinationCompanySiret: destination.siret,
        emitterCompanySiret: emitter.siret,
        workerCompanySiret: worker.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "Le SIRET de l'entreprise de destination a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should allow updating transporter if they didn't sign", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await companyFactory();
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
        company: { siret: transporter.siret },
        transport: {
          mode: TransportMode.AIR
        }
      }
    };
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toBeUndefined();

    expect(data.updateBsda.transporter!.transport!.mode).toEqual(
      TransportMode.AIR
    );

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    // le champ dénormalisé `transporterOrgIds` doit être mis à jour
    expect(updatedBsda.transportersOrgIds).toEqual([transporter.siret]);
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
        destinationCompanySiret: company2.siret
      },
      transporterOpt: {
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "Le SIRET de l'entreprise de travaux a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should update transporter recepisse with data pulled from db", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_PRODUCER",
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date()
      },
      transporterOpt: {
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
        emitterEmissionSignatureDate: new Date()
      },
      transporterOpt: {
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
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret,
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
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
          "Le nom du transporteur n°1 a été verrouillé via signature et ne peut pas être modifié."
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
        destinationOperationCode: "D 15"
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    const bsdaToGroup = await bsdaFactory({
      opt: {
        type: "RESHIPMENT",
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        destinationOperationCode: "D 15"
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
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
        destinationOperationCode: "D 15",
        destinationOperationMode: undefined
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
      }
    });

    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL",
        emitterCompanySiret: ttr.company.siret,
        destinationCompanySiret: destination.company.siret,
        destinationOperationCode: "D 15",
        destinationOperationMode: undefined,
        forwarding: { connect: { id: oldForwarded.id } }
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
      }
    });

    const newForwarded = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: ttr.company.siret,
        destinationOperationCode: "D 15",
        destinationOperationMode: undefined
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
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
        destinationOperationCode: "D 15",
        destinationOperationMode: undefined
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
      }
    });
    const associatedBsda2 = await bsdaFactory({
      opt: {
        status: "AWAITING_CHILD",
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret,
        destinationOperationCode: "D 15",
        destinationOperationMode: undefined
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
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
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
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
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input
      }
    });

    expect(errors).toBeUndefined();

    expect(data.updateBsda.intermediaries!.length).toBe(1);
  });

  it("should reject if updating intermediaries when its value is locked", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN
    );

    const bsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: company.siret,
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
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date()
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
      "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés : " +
        "Les intermédiaires a été verrouillé via signature et ne peut pas être modifié."
    );
  });

  it("should allow updating destination if the planned destination becomes the nextDestination", async () => {
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const destination2 = await companyFactory();
    const worker = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        status: "SIGNED_BY_WORKER",
        destinationCompanySiret: destination.company.siret,
        workerCompanySiret: worker.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
      }
    });

    const { mutate } = makeClient(transporter.user);

    const input = {
      destination: {
        company: {
          siret: destination2.siret
        },
        operation: {
          nextDestination: {
            company: {
              siret: destination.company.siret,
              address: "adresse",
              contact: "contact",
              phone: "0101010101",
              mail: "o@o.fr"
            },
            plannedOperationCode: "R 5",
            cap: "cap"
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

    expect(updatedBsda?.destinationCompanySiret).toBe(destination2.siret);
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
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
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
            company: {
              siret: transporter.company.siret,
              address: "adresse",
              contact: "contact",
              phone: "0101010101",
              mail: "o@o.fr"
            },
            plannedOperationCode: "R 5",
            cap: "cap"
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
        destinationOperationNextDestinationCompanySiret:
          destination.company.siret,
        emitterEmissionSignatureDate: new Date(),
        workerWorkSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret
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

  it("should be possible to re-send same transporter data after transporter signature", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT",
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterTransportSignatureDate: new Date(),
        transporterTransportTakenOverAt: new Date()
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
          transporter: {
            company: {
              siret: bsda.transporters[0].transporterCompanySiret
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
  });

  it("should be possible to update transporters with the `transporters` field", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");
    const transporter4 = await userWithCompanyFactory("MEMBER");
    const transporter5 = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const [
      bsdaTransporter1,
      bsdaTransporter2,
      bsdaTransporter3,
      bsdaTransporter4,
      bsdaTransporter5
    ] = await Promise.all(
      [
        transporter1,
        transporter2,
        transporter3,
        transporter4,
        transporter5
      ].map((transporter, idx) => {
        return prisma.bsdaTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsda with two transporters
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsdaTransporter1.id }, { id: bsdaTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Update the bsda by removing the initial two transporters
    // and adding three others
    const input: BsdaInput = {
      transporters: [
        bsdaTransporter3.id,
        bsdaTransporter4.id,
        bsdaTransporter5.id
      ]
    };
    const { errors: errors1 } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors1).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsda);

    expect(transporters).toHaveLength(3);
    expect(transporters[0]).toMatchObject({
      id: bsdaTransporter3.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsdaTransporter4.id,
      number: 2 // number should have been set correctly
    });
    expect(transporters[2]).toMatchObject({
      id: bsdaTransporter5.id,
      number: 3 // number should have been set correctly
    });

    const transporter6 = await userWithCompanyFactory("MEMBER");
    const bsddTransporter6 = await prisma.bsdaTransporter.create({
      data: {
        number: 6,
        transporterCompanySiret: transporter6.company.siret
      }
    });

    // it should not be possible though to set more than 5 transporters
    const { errors: errors2 } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          transporters: [
            bsdaTransporter1.id,
            bsdaTransporter2.id,
            bsdaTransporter3.id,
            bsdaTransporter4.id,
            bsdaTransporter5.id,
            bsddTransporter6.id
          ]
        }
      }
    });

    expect(errors2).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas ajouter plus de 5 transporteurs"
      })
    ]);
  });

  it("should be possible to swap the order of the different transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const [bsdaTransporter1, bsdaTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsdaTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsda with two transporters in a given order
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsdaTransporter1.id }, { id: bsdaTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // swap the order
    const input: BsdaInput = {
      transporters: [bsdaTransporter2.id, bsdaTransporter1.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsda);

    expect(transporters).toHaveLength(2);
    expect(transporters[0]).toMatchObject({
      id: bsdaTransporter2.id,
      number: 1 // number should have been set correctly
    });
    expect(transporters[1]).toMatchObject({
      id: bsdaTransporter1.id,
      number: 2 // number should have been set correctly
    });
  });

  it("should be possible to empty transporters list", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const [bsdaTransporter1, bsdaTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsdaTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsda with two transporters
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsdaTransporter1.id }, { id: bsdaTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    const input: BsdaInput = {
      transporters: []
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsda);
    expect(transporters).toHaveLength(0);
  });

  it("should throw exception if transporters ID's don't exist", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });
    const { mutate } = makeClient(emitter.user);

    const input: BsdaInput = {
      transporters: ["ID1", "ID2"]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Aucun transporteur ne possède le ou les identifiants suivants : ID1, ID2"
      })
    ]);
  });

  it("should update the first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const [bsdaTransporter1, bsdaTransporter2] = await Promise.all(
      [transporter1, transporter2].map((transporter, idx) => {
        return prisma.bsdaTransporter.create({
          data: {
            number: idx + 1,
            transporterCompanySiret: transporter.company.siret
          }
        });
      })
    );

    // Initiate the bsda with two transporters
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [{ id: bsdaTransporter1.id }, { id: bsdaTransporter2.id }]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // update first transporter with deprecated field `transporter`
    const input: BsdaInput = {
      transporter: { company: { contact: "Obiwan" } }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsda);
    expect(transporters).toHaveLength(2);
    expect(transporters[0].id).toEqual(bsdaTransporter1.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsdaTransporter2.id);
    expect(transporters[1].number).toEqual(bsdaTransporter2.number);
    expect(transporters[0].transporterCompanyContact).toEqual("Obiwan");
  });

  it("should delete first transporter and do not updates next transporters", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.company.siret
      }
    });

    const [bsdaTransporter1, bsdaTransporter2, bsdaTransporter3] =
      await Promise.all(
        [transporter1, transporter2, transporter3].map((transporter, idx) => {
          return prisma.bsdaTransporter.create({
            data: {
              number: idx + 1,
              transporterCompanySiret: transporter.company.siret
            }
          });
        })
      );

    // Initiate the bsda with two transporters
    await prisma.bsda.update({
      where: { id: bsda.id },
      data: {
        transporters: {
          deleteMany: {},
          connect: [
            { id: bsdaTransporter1.id },
            { id: bsdaTransporter2.id },
            { id: bsdaTransporter3.id }
          ]
        }
      }
    });

    const { mutate } = makeClient(emitter.user);

    // set first transporter to `null` with deprecated field `transporter`
    const input: BsdaInput = {
      transporter: null
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const transporters = getTransportersSync(updatedBsda);
    expect(transporters).toHaveLength(2);

    // transporters ordering should have been decremented
    expect(transporters[0].id).toEqual(bsdaTransporter2.id);
    expect(transporters[0].number).toEqual(1);
    expect(transporters[1].id).toEqual(bsdaTransporter3.id);
    expect(transporters[1].number).toEqual(bsdaTransporter2.number);
  });

  it("should not be possible to update `transporters` when the bsda has been processed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsda that has already been processed
    const bsda = await bsdaFactory({
      opt: {
        status: "PROCESSED",
        emitterEmissionSignatureDate: new Date(),
        destinationOperationSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret,
        transporterTransportSignatureDate: new Date()
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.company.siret,
        number: 1,
        transporterTransportSignatureDate: new Date()
      }
    });

    const bsdaTransporter1 = await getFirstTransporter(bsda);

    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter
    const input: BsdaInput = {
      transporters: [bsdaTransporter1!.id, bsdaTransporter2.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " La liste des transporteurs a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should not be possible to remove or permutate a transporter that has already signed when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsda that has already been sent
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportSignatureDate: new Date()
      }
    });

    const bsdaTransporter1 = await getFirstTransporter(bsda);

    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying permuting two transporters
    const input: BsdaInput = {
      transporters: [bsdaTransporter2.id, bsdaTransporter1!.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le transporteur n°1 a déjà signé le BSDA, il ne peut pas être supprimé ou modifié"
      })
    ]);
  });

  it("should be possible to remove or permute transporters that has not signed yet when status is SENT", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");
    const transporter3 = await userWithCompanyFactory("MEMBER");

    // Create a bsda that has already been signed by the first transporter
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportSignatureDate: new Date()
      }
    });

    const bsdaTransporter1 = await getFirstTransporter(bsda);

    // Transporter n°2 (not signed yet)
    const bsdaTransporter2 = await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: {
        transporterCompanySiret: transporter2.company.siret,
        transporterTransportSignatureDate: null
      }
    });

    // Transporter n°3 (not signed yet)
    const bsdaTransporter3 = await bsdaTransporterFactory({
      bsdaId: bsda.id,
      opts: {
        transporterCompanySiret: transporter3.company.siret,
        transporterTransportSignatureDate: null
      }
    });

    // Permute transporter 2 and transporter 2
    const input: BsdaInput = {
      transporters: [
        bsdaTransporter1!.id,
        bsdaTransporter3.id,
        bsdaTransporter2.id
      ]
    };
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });
    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const updatedTransporters = getTransportersSync(updatedBsda);

    expect(updatedTransporters).toHaveLength(3);
    expect(updatedTransporters[0].id).toEqual(bsdaTransporter1!.id);
    expect(updatedTransporters[1].id).toEqual(bsdaTransporter3.id);
    expect(updatedTransporters[2].id).toEqual(bsdaTransporter2.id);
  });

  it("should not be possible to update `transporter` (first transporter) when the bsda has been sent", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("MEMBER");

    // Create a form that has already been sent
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter.company.siret,
        transporterTransportSignatureDate: new Date()
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Try update first transporter
    const input: BsdaInput = {
      transporter: { transport: { mode: "RAIL" } }
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le mode de transport n°1 a été verrouillé via signature et ne peut pas être modifié."
      })
    ]);
  });

  it("should be possible to add a new transporter while the bsda has not been received", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsda that has already been received
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportSignatureDate: new Date()
      }
    });

    const bsdaTransporter1 = await getFirstTransporter(bsda);

    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying adding a new transporter after the first one
    const input: BsdaInput = {
      transporters: [bsdaTransporter1!.id, bsdaTransporter2.id]
    };
    const { errors } = await mutate<Pick<Mutation, "updateBsda">>(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toBeUndefined();

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id },
      include: { transporters: true }
    });

    const updatedTransporters = getTransportersSync(updatedBsda);

    expect(updatedTransporters).toHaveLength(2);
    expect(updatedTransporters[0].id).toEqual(bsdaTransporter1!.id);
    expect(updatedTransporters[1].id).toEqual(bsdaTransporter2.id);
  });

  it("should not be possible to remove a transporter that has already signed", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter1 = await userWithCompanyFactory("MEMBER");
    const transporter2 = await userWithCompanyFactory("MEMBER");

    // Create a bsda that has already been received
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret
      },
      transporterOpt: {
        transporterCompanySiret: transporter1.company.siret,
        transporterTransportSignatureDate: new Date()
      }
    });

    const bsdaTransporter2 = await prisma.bsdaTransporter.create({
      data: {
        number: 0,
        transporterCompanySiret: transporter2.company.siret
      }
    });

    const { mutate } = makeClient(emitter.user);

    // Trying removing first transporter and set a different one
    const input: BsdaInput = {
      transporters: [bsdaTransporter2.id]
    };
    const { errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: { id: bsda.id, input }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Des champs ont été verrouillés via signature et ne peuvent plus être modifiés :" +
          " Le transporteur n°1 a déjà signé le BSDA, il ne peut pas être supprimé ou modifié"
      })
    ]);
  });

  it("should log in an event the updated data", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        status: "INITIAL",
        emitterCompanySiret: company.siret
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
          waste: {
            code: "06 13 04*"
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsda.waste?.code).toBe("06 13 04*");

    const events = await getStream(bsda.id);
    const updateEvent = events.find(evt => evt.type === "BsdaUpdated");

    expect(updateEvent).toBeDefined();
    expect(updateEvent?.data?.["wasteCode"]).toBe("06 13 04*");
  });

  it("should be possible to update destination without erasing destination reception weight", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");

    // Create a form that has already been sent
    const bsda = await bsdaFactory({
      opt: {
        status: "SENT",
        weightValue: 1000,
        emitterEmissionSignatureDate: new Date(),
        emitterCompanySiret: emitter.company.siret,
        destinationCompanySiret: destination.company.siret
      }
    });

    const { mutate } = makeClient(destination.user);

    let input: BsdaInput = {
      destination: { reception: { weight: 2 } }
    };
    const { errors: errors1 } = await mutate<Pick<Mutation, "updateBsda">>(
      UPDATE_BSDA,
      {
        variables: { id: bsda.id, input }
      }
    );
    expect(errors1).toBeUndefined();

    let updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(updatedBsda.destinationReceptionWeight!.toNumber()).toEqual(
      2000 // 2 * 1000
    );
    input = {
      destination: { operation: { code: "D 5" } }
    };
    const { errors: errors2 } = await mutate<Pick<Mutation, "updateBsda">>(
      UPDATE_BSDA,
      {
        variables: { id: bsda.id, input }
      }
    );
    expect(errors2).toBeUndefined();

    updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(updatedBsda.destinationReceptionWeight!.toNumber()).toEqual(
      2000 // 2 * 1000
    );
  });

  describe("updating the CAP", () => {
    const previousBsda = {
      destinationCap: "A",
      status: BsdaStatus.SIGNED_BY_PRODUCER,
      emitterCompanySiret: "emitter company siret",
      workerCompanySiret: "worker company siret"
    } as Bsda;
    const updatedBsda = {
      destinationCap: "A",
      status: BsdaStatus.SIGNED_BY_PRODUCER,
      emitterCompanySiret: "emitter company siret",
      workerCompanySiret: "worker company siret"
    } as Bsda;

    const previousBsdaWithNextDestination = {
      destinationCap: "A",
      status: BsdaStatus.SIGNED_BY_PRODUCER,
      emitterCompanySiret: "emitter company siret",
      workerCompanySiret: "worker company siret",
      destinationOperationNextDestinationCompanySiret:
        "next destination company siret",
      destinationOperationNextDestinationCap: "A"
    } as Bsda;
    const updatedBsdaWithNextDestination = {
      destinationCap: "A",
      status: BsdaStatus.SIGNED_BY_PRODUCER,
      emitterCompanySiret: "emitter company siret",
      workerCompanySiret: "worker company siret",
      destinationOperationNextDestinationCompanySiret:
        "next destination company siret",
      destinationOperationNextDestinationCap: "A"
    } as Bsda;

    beforeEach(() => {
      jest.resetAllMocks();
    });

    describe("producerShouldBeNotifiedOfDestinationCapModification", () => {
      it.each([
        // Status pas bon
        [previousBsda, { ...updatedBsda, status: BsdaStatus.INITIAL }],
        // Pas d'entreprise de travaux
        [previousBsda, { ...updatedBsda, workerCompanySiret: undefined }],
        // Pas d'émetteur
        [previousBsda, { ...updatedBsda, emitterCompanySiret: undefined }],
        // destinationCap identique
        [previousBsda, updatedBsda],
        // nextDestinationCap identique
        [previousBsdaWithNextDestination, updatedBsdaWithNextDestination]
      ])(
        "should return false - previous: %p, updated: %p",
        (previousBsda, updatedBsda) => {
          // Given

          // When
          const shouldBeNotified =
            producerShouldBeNotifiedOfDestinationCapModification(
              previousBsda,
              updatedBsda as Bsda
            );

          // Then
          expect(shouldBeNotified).toBeFalsy();
        }
      );

      it.each([
        // destinationCap différent
        [previousBsda, { ...updatedBsda, destinationCap: "B" }],
        // nextDestinationCap différent
        [
          previousBsdaWithNextDestination,
          {
            ...updatedBsdaWithNextDestination,
            destinationOperationNextDestinationCap: "B"
          }
        ]
      ])(
        "should return true - previous: %p, updated: %p",
        (previousBsda, updatedBsda) => {
          // Given

          // When
          const shouldBeNotified =
            producerShouldBeNotifiedOfDestinationCapModification(
              previousBsda,
              updatedBsda
            );

          // Then
          expect(shouldBeNotified).toBeTruthy();
        }
      );
    });

    describe("sendDestinationCapModificationMail", () => {
      beforeEach(async () => {
        jest.resetAllMocks();
        await resetDatabase();
      });

      it("should send email - destination", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const transporter = await companyFactory();

        await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            destinationCap: "A",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: destination.siret,
            destinationCompanyName: destination.name
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        await sendDestinationCapModificationMail(bsda, {
          ...bsda,
          destinationCap: "B"
        });

        // Then
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
        expect(sendMail as jest.Mock).toHaveBeenCalledWith(
          expect.objectContaining({
            body: `<p>
  Trackdéchets vous informe qu'une modification a été apportée sur le bordereau
  amiante n° ${bsda.id} que vous avez signé.
</p>
<br />
<p>
  Le champ CAP initialement A est désormais remplacé par
  B.
</p>
<br />
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${bsda.workerCompanyName}
  ${bsda.workerCompanySiret} mandatée et visée sur ce même bordereau, ou de
  l'établissement de destination finale ${bsda.destinationCompanyName}
  ${bsda.destinationCompanySiret}.
</p>
`,
            messageVersions: [
              { to: [{ email: "emitter@mail.com", name: "Emitter" }] }
            ],
            subject: `CAP du bordereau amiante n° ${bsda.id} mis à jour par B`
          })
        );
      });

      it("should send email - nextDestination", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const nextDestination = await companyFactory();
        const transporter = await companyFactory();

        await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            destinationCap: "A",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: destination.siret,
            destinationCompanyName: destination.name,
            destinationOperationNextDestinationCompanySiret:
              nextDestination.siret,
            destinationOperationNextDestinationCompanyName: nextDestination.name
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        await sendDestinationCapModificationMail(bsda, {
          ...bsda,
          destinationCap: "B"
        });

        // Then
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
        expect(sendMail as jest.Mock).toHaveBeenCalledWith(
          expect.objectContaining({
            body: `<p>
  Trackdéchets vous informe qu'une modification a été apportée sur le bordereau
  amiante n° ${bsda.id} que vous avez signé.
</p>
<br />
<p>
  Le champ CAP initialement A est désormais remplacé par
  B.
</p>
<br />
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${bsda.workerCompanyName}
  ${bsda.workerCompanySiret} mandatée et visée sur ce même bordereau, ou de
  l'établissement de destination finale ${bsda.destinationOperationNextDestinationCompanyName}
  ${bsda.destinationOperationNextDestinationCompanySiret}.
</p>
`,
            messageVersions: [
              { to: [{ email: "emitter@mail.com", name: "Emitter" }] }
            ],
            subject: `CAP du bordereau amiante n° ${bsda.id} mis à jour par B`
          })
        );
      });
    });

    describe("[bug prod]", () => {
      beforeEach(resetDatabase);

      it("if user updates the BSDA by adding a nextDestination but does not modify the CAP - should not send mail", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const ttr = await companyFactory();
        const transporter = await companyFactory();

        const user = await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            destinationCap: "DESTINATION-CAP",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: destination.siret,
            destinationCompanyName: destination.name
            // No next destination
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "updateBsda">,
          MutationUpdateBsdaArgs
        >(UPDATE_BSDA, {
          variables: {
            id: bsda.id,
            input: {
              destination: {
                cap: "TTR-CAP",
                company: {
                  siret: ttr.siret
                },
                operation: {
                  // User adds a next destination!
                  nextDestination: {
                    cap: "DESTINATION-CAP",
                    company: {
                      siret: destination.siret
                    }
                  }
                }
              }
            }
          }
        });

        // Then
        expect(errors).toBeUndefined();
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
      });

      it("if user updates the BSDA by adding a nextDestination, and modifies the destination CAP - should send mail", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const ttr = await companyFactory();
        const transporter = await companyFactory();

        const user = await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            destinationCap: "DESTINATION-CAP",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: destination.siret,
            destinationCompanyName: destination.name
            // No next destination
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "updateBsda">,
          MutationUpdateBsdaArgs
        >(UPDATE_BSDA, {
          variables: {
            id: bsda.id,
            input: {
              destination: {
                cap: "TTR-CAP",
                company: {
                  siret: ttr.siret,
                  name: ttr.name
                },
                operation: {
                  // User adds a next destination AND modifies the CAP!
                  nextDestination: {
                    cap: "NEW-DESTINATION-CAP",
                    company: {
                      siret: destination.siret,
                      name: destination.name
                    }
                  }
                }
              }
            }
          }
        });

        // Then
        const updatedBsda = await prisma.bsda.findFirstOrThrow({
          where: { id: bsda.id }
        });
        expect(errors).toBeUndefined();
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
        expect(sendMail as jest.Mock).toHaveBeenCalledWith(
          expect.objectContaining({
            body: `<p>
  Trackdéchets vous informe qu'une modification a été apportée sur le bordereau
  amiante n° ${updatedBsda.id} que vous avez signé.
</p>
<br />
<p>
  Le champ CAP initialement DESTINATION-CAP est désormais remplacé par
  NEW-DESTINATION-CAP.
</p>
<br />
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${updatedBsda.workerCompanyName}
  ${updatedBsda.workerCompanySiret} mandatée et visée sur ce même bordereau, ou de
  l'établissement de destination finale ${updatedBsda.destinationOperationNextDestinationCompanyName}
  ${updatedBsda.destinationOperationNextDestinationCompanySiret}.
</p>
`,
            messageVersions: [
              { to: [{ email: "emitter@mail.com", name: "Emitter" }] }
            ],
            subject: `CAP du bordereau amiante n° ${updatedBsda.id} mis à jour par NEW-DESTINATION-CAP`
          })
        );
      });

      it("if user updates the BSDA by removing a nextDestination, but does not change the CAP - should not send mail", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const ttr = await companyFactory();
        const transporter = await companyFactory();

        const user = await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: ttr.siret,
            destinationCompanyName: ttr.name,
            destinationCap: "TTR-CAP",
            destinationOperationNextDestinationCompanySiret: destination.siret,
            destinationOperationNextDestinationCompanyName: destination.name,
            destinationOperationNextDestinationCap: "DESTINATION-CAP"
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "updateBsda">,
          MutationUpdateBsdaArgs
        >(UPDATE_BSDA, {
          variables: {
            id: bsda.id,
            input: {
              destination: {
                cap: "DESTINATION-CAP",
                company: {
                  siret: destination.siret,
                  name: destination.name
                },
                operation: {
                  // User removes the next destination
                  nextDestination: {
                    cap: null,
                    company: null
                  }
                }
              }
            }
          }
        });

        // Then
        expect(errors).toBeUndefined();
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
      });

      it("if user updates the BSDA by removing the nextDestination, and modifies the destination CAP - should send mail", async () => {
        // Given
        const emitter = await companyFactory();
        const worker = await companyFactory();
        const destination = await companyFactory();
        const ttr = await companyFactory();
        const transporter = await companyFactory();

        const user = await userInCompany(
          "MEMBER",
          emitter.id,
          {
            email: "emitter@mail.com",
            name: "Emitter"
          },
          {
            notificationIsActiveBsdaFinalDestinationUpdate: true
          }
        );

        const bsda = await bsdaFactory({
          opt: {
            status: "SIGNED_BY_PRODUCER",
            // Companies
            emitterCompanySiret: emitter.siret,
            emitterCompanyName: emitter.name,
            workerCompanySiret: worker.siret,
            workerCompanyName: worker.name,
            destinationCompanySiret: ttr.siret,
            destinationCompanyName: ttr.name,
            destinationCap: "TTR-CAP",
            destinationOperationNextDestinationCompanySiret: destination.siret,
            destinationOperationNextDestinationCompanyName: destination.name,
            destinationOperationNextDestinationCap: "DESTINATION-CAP"
          },
          transporterOpt: {
            transporterCompanySiret: transporter.siret,
            transporterCompanyName: transporter.name
          }
        });

        // No mails
        const { sendMail } = require("../../../../mailer/mailing");
        jest.mock("../../../../mailer/mailing");
        (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

        // When
        const { mutate } = makeClient(user);
        const { errors } = await mutate<
          Pick<Mutation, "updateBsda">,
          MutationUpdateBsdaArgs
        >(UPDATE_BSDA, {
          variables: {
            id: bsda.id,
            input: {
              destination: {
                cap: "NEW-DESTINATION-CAP",
                company: {
                  siret: destination.siret,
                  name: destination.name
                },
                operation: {
                  // User removes the next destination
                  nextDestination: {
                    cap: null,
                    company: null
                  }
                }
              }
            }
          }
        });

        // Then
        const updatedBsda = await prisma.bsda.findFirstOrThrow({
          where: { id: bsda.id }
        });
        expect(errors).toBeUndefined();
        expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
        expect(sendMail as jest.Mock).toHaveBeenCalledWith(
          expect.objectContaining({
            body: `<p>
  Trackdéchets vous informe qu'une modification a été apportée sur le bordereau
  amiante n° ${updatedBsda.id} que vous avez signé.
</p>
<br />
<p>
  Le champ CAP initialement DESTINATION-CAP est désormais remplacé par
  NEW-DESTINATION-CAP.
</p>
<br />
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${updatedBsda.workerCompanyName}
  ${updatedBsda.workerCompanySiret} mandatée et visée sur ce même bordereau, ou de
  l'établissement de destination finale ${updatedBsda.destinationCompanyName}
  ${updatedBsda.destinationCompanySiret}.
</p>
`,
            messageVersions: [
              { to: [{ email: "emitter@mail.com", name: "Emitter" }] }
            ],
            subject: `CAP du bordereau amiante n° ${updatedBsda.id} mis à jour par NEW-DESTINATION-CAP`
          })
        );
      });
    });
  });

  describe("closed sirets", () => {
    // eslint-disable-next-line prefer-const
    let searchCompanyMock = jest.fn().mockReturnValue({});
    let makeClientLocal: typeof makeClient;

    beforeAll(async () => {
      // Mock les appels à la base SIRENE
      jest.mock("../../../../companies/search", () => ({
        // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
        ...jest.requireActual("../../../../companies/search"),
        searchCompany: searchCompanyMock
      }));

      // Ré-importe makeClient pour que searchCompany soit bien mocké
      jest.resetModules();
      makeClientLocal = require("../../../../__tests__/testClient")
        .default as typeof makeClient;
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await resetDatabase();
    });

    it("should allow updating emitter if they didn't sign", async () => {
      // Given
      const { company: company1, user } = await userWithCompanyFactory(
        UserRole.ADMIN,
        {
          name: "Company 1"
        }
      );
      const { company: company2, user: _user2 } = await userWithCompanyFactory(
        UserRole.ADMIN,
        {
          name: "Company 2"
        }
      );
      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: company1.siret,
          emitterCompanyName: company1.name,
          destinationCompanySiret: company2.siret,
          destinationCompanyName: company2.name
        }
      });

      searchCompanyMock.mockImplementation(siret => {
        if (siret === company1.siret) {
          return {
            siret,
            etatAdministratif: "O",
            address: company1.address,
            name: company1.name
          };
        }

        if (siret === company2.siret) {
          return {
            siret,
            etatAdministratif: "O",
            address: company2.address,
            name: company2.name
          };
        }
      });

      const { mutate } = makeClientLocal(user);

      const input = {
        emitter: {
          company: {
            siret: company2.orgId
          }
        },
        destination: {
          company: {
            siret: company1.orgId
          }
        }
      };

      // When
      const { data } = await mutate<
        Pick<Mutation, "updateBsda">,
        MutationUpdateBsdaArgs
      >(UPDATE_BSDA, {
        variables: {
          id: bsda.id,
          input
        }
      });

      // Then
      expect(data.updateBsda?.destination?.company?.name).toEqual(
        company1.name
      );
      expect(data.updateBsda?.emitter?.company?.name).toEqual(company2.name);
    });
  });

  describe("closed sirets", () => {
    // eslint-disable-next-line prefer-const
    let searchCompanyMock = jest.fn().mockReturnValue({});
    let makeClientLocal: typeof makeClient;

    beforeAll(async () => {
      // Mock les appels à la base SIRENE
      jest.mock("../../../../companies/search", () => ({
        // https://www.chakshunyu.com/blog/how-to-mock-only-one-function-from-a-module-in-jest/
        ...jest.requireActual("../../../../companies/search"),
        searchCompany: searchCompanyMock
      }));

      // Ré-importe makeClient pour que searchCompany soit bien mocké
      jest.resetModules();
      makeClientLocal = require("../../../../__tests__/testClient")
        .default as typeof makeClient;
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await resetDatabase();
    });

    const createUserAndBsda = async (
      input: Partial<Prisma.BsdaCreateInput> = {}
    ) => {
      const emitterCompanyAndUser = await userWithCompanyFactory("MEMBER", {
        name: "Emitter"
      });
      const user = emitterCompanyAndUser.user;
      const emitter = emitterCompanyAndUser.company;
      const destination = await companyFactory({ name: "Destination" });
      const nextDestination = await companyFactory({ name: "Destination" });
      const transporter = await companyFactory({ name: "Transporter" });
      const worker = await companyFactory({ name: "Worker" });
      const broker = await companyFactory({
        name: "Broker",
        companyTypes: ["BROKER"],
        brokerReceipt: {
          create: {
            receiptNumber: "recepisse",
            department: "07",
            validityLimit: new Date()
          }
        }
      });
      const intermediary = await companyFactory({ name: "Intermediary" });
      const ecoOrganisme = await ecoOrganismeFactory({
        handle: { handleBsda: true },
        createAssociatedCompany: true
      });

      const bsda = await bsdaFactory({
        opt: {
          status: BsdaStatus.INITIAL,
          emitterCompanySiret: emitter.siret,
          destinationCompanySiret: destination.siret,
          destinationOperationNextDestinationCompanySiret:
            nextDestination.siret,
          destinationOperationNextDestinationCompanyName: nextDestination.name,
          destinationOperationNextDestinationCompanyAddress:
            "Next destination address",
          destinationOperationNextDestinationCompanyContact:
            "Next destination contact",
          destinationOperationNextDestinationCompanyPhone: "060102030405",
          destinationOperationNextDestinationCompanyMail:
            "next.destination@mail.com",
          destinationOperationNextDestinationCap: "Next destination CAP",
          destinationOperationNextDestinationPlannedOperationCode: "R5",
          workerCompanySiret: worker.siret,
          brokerCompanySiret: broker.siret,
          transporters: {
            createMany: {
              data: [
                {
                  number: 1,
                  transporterCompanySiret: transporter.siret,
                  transporterCompanyName: transporter.name
                }
              ]
            }
          },
          intermediaries: {
            create: [
              {
                siret: intermediary.siret!,
                name: intermediary.name,
                address: "intermediary address",
                contact: "intermediary"
              }
            ]
          },
          ecoOrganismeSiret: ecoOrganisme.siret,
          ...input
        }
      });

      return { user, bsda };
    };

    it("should not be able to do an update if a siret is closed", async () => {
      // Given
      const { user, bsda } = await createUserAndBsda();

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: siret === bsda.emitterCompanySiret ? "F" : "O",
          address: "Company address",
          name: "Company name"
        };
      });

      // When
      const { mutate } = makeClientLocal(user);
      const { errors } = await mutate<Pick<Mutation, "updateBsda">>(
        UPDATE_BSDA,
        {
          variables: {
            id: bsda.id,
            input: {
              waste: {
                code: "06 13 04*"
              }
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'établissement ${bsda.emitterCompanySiret} est fermé selon le répertoire SIRENE`
      );
    });

    it("should be able to do an update if a siret is closed but field is sealed", async () => {
      // Given
      const { user, bsda } = await createUserAndBsda({
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Emitter",
        status: "SIGNED_BY_PRODUCER"
      });

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: siret === bsda.emitterCompanySiret ? "F" : "O",
          address: "Company address",
          name: "Company name"
        };
      });

      // When
      const { mutate } = makeClientLocal(user);
      const { errors } = await mutate<Pick<Mutation, "updateBsda">>(
        UPDATE_BSDA,
        {
          variables: {
            id: bsda.id,
            input: {
              waste: {
                code: "06 13 04*"
              }
            }
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
    });

    it("should not be able to do an update if a siret is dormant", async () => {
      // Given
      const { user, bsda } = await createUserAndBsda();

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: "O",
          address: "Company address",
          name: "Company name"
        };
      });

      await prisma.company.update({
        where: { siret: bsda.emitterCompanySiret! },
        data: { isDormantSince: new Date() }
      });

      // When
      const { mutate } = makeClientLocal(user);
      const { errors } = await mutate<Pick<Mutation, "updateBsda">>(
        UPDATE_BSDA,
        {
          variables: {
            id: bsda.id,
            input: {
              waste: {
                code: "06 13 04*"
              }
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'établissement avec le SIRET ${bsda.emitterCompanySiret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
      );
    });

    it("should be able to do an update if a siret is dormant but field is sealed", async () => {
      // Given
      const { user, bsda } = await createUserAndBsda({
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Emitter",
        status: "SIGNED_BY_PRODUCER"
      });

      searchCompanyMock.mockImplementation(siret => {
        return {
          siret,
          etatAdministratif: "O",
          address: "Company address",
          name: "Company name"
        };
      });

      await prisma.company.update({
        where: { siret: bsda.emitterCompanySiret! },
        data: { isDormantSince: new Date() }
      });

      // When
      const { mutate } = makeClientLocal(user);
      const { errors } = await mutate<Pick<Mutation, "updateBsda">>(
        UPDATE_BSDA,
        {
          variables: {
            id: bsda.id,
            input: {
              waste: {
                code: "06 13 04*"
              }
            }
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
    });
  });

  it("can update destinationReceptionRefusedWeight, and acceptedWeight should be returned", async () => {
    // Given
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          destination: {
            reception: {
              weight: 4,
              acceptationStatus: "PARTIALLY_REFUSED",
              refusalReason: "Nope",
              refusedWeight: 1.5
            }
          }
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.updateBsda.destination?.reception?.weight).toBe(4);
    expect(data.updateBsda.destination?.reception?.acceptationStatus).toBe(
      "PARTIALLY_REFUSED"
    );
    expect(data.updateBsda.destination?.reception?.refusedWeight).toBe(1.5);
    expect(data.updateBsda.destination?.reception?.acceptedWeight).toBe(2.5);

    const dbBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(dbBsda.destinationReceptionWeight?.toNumber()).toBe(4000);
    expect(dbBsda.destinationReceptionRefusedWeight?.toNumber()).toBe(1500);
    expect(dbBsda.destinationReceptionAcceptationStatus).toBe(
      "PARTIALLY_REFUSED"
    );
  });

  it("can update destinationReceptionWeight without specifying destinationReceptionRefusedWeight", async () => {
    // Given
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        destinationReceptionRefusedWeight: null
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsda">,
      MutationUpdateBsdaArgs
    >(UPDATE_BSDA, {
      variables: {
        id: bsda.id,
        input: {
          destination: {
            reception: {
              weight: 4,
              acceptationStatus: "PARTIALLY_REFUSED",
              refusalReason: "Nope",
              refusedWeight: null // Optional
            }
          }
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.updateBsda.destination?.reception?.weight).toBe(4);
    expect(data.updateBsda.destination?.reception?.acceptationStatus).toBe(
      "PARTIALLY_REFUSED"
    );
    expect(data.updateBsda.destination?.reception?.refusedWeight).toBe(null);
    expect(data.updateBsda.destination?.reception?.acceptedWeight).toBe(null);

    const dbBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(dbBsda.destinationReceptionWeight?.toNumber()).toBe(4000);
    expect(dbBsda.destinationReceptionRefusedWeight?.toNumber()).toBe(
      undefined
    );
    expect(dbBsda.destinationReceptionAcceptationStatus).toBe(
      "PARTIALLY_REFUSED"
    );
  });
});
