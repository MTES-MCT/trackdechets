import { resetDatabase } from "../../../../../integration-tests/helper";

import {
  companyFactory,
  getDestinationCompanyInfo,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../__tests__/factories";
import { BsdasriStatus } from "@prisma/client";
import { prisma } from "@td/prisma";
import type { Mutation } from "@td/codegen-back";
import { gql } from "graphql-tag";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { ErrorCode } from "../../../../common/errors";

const CREATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation DasriCreate($input: BsdasriInput!) {
    createBsdasri(input: $input) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Mutation.createDasri", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should build a synthesis dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      name: "el transporteur",
      address: "playa del mar",
      companyTypes: {
        set: ["COLLECTOR", "TRANSPORTER"]
      }
    });

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: company.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const toAssociate2 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(3),
        transporterCompanySiret: company.siret,
        destinationCompanySiret: siretify(4),
        destinationOperationCode: "D10",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 6 },
          { type: "FUT", volume: 100, quantity: 3 }
        ],
        transporterWasteVolume: 30
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      transporter: {
        company: {
          name: "le transporteur",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
          address: "avenue de la mer"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate1.id, toAssociate2.id]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.synthesizing?.map(bsd => bsd.id)).toEqual([
      toAssociate1.id,
      toAssociate2.id
    ]);
    expect(data.createBsdasri.type).toEqual("SYNTHESIS");
    const grouped1 = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: toAssociate1.id }
    });
    const grouped2 = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: toAssociate2.id }
    });
    expect(grouped1.synthesizedInId).toEqual(data.createBsdasri.id);

    expect(grouped2.synthesizedInId).toEqual(data.createBsdasri.id);

    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    const packaging = [
      { type: "BOITE_CARTON", volume: 10, quantity: 9 },
      { type: "FUT", volume: 100, quantity: 3 }
    ];
    const totalVolume = 100 + 30;

    // transporter company fields are recorded on emitter too
    expect(created.type).toEqual("SYNTHESIS");
    expect(created.emitterCompanyName).toEqual("el transporteur");
    expect(created.emitterCompanySiret).toEqual(company.siret);
    expect(created.emitterCompanyContact).toEqual("jean durand");
    expect(created.emitterCompanyAddress).toEqual("playa del mar");
    expect(created.emitterCompanyPhone).toEqual("06 18 76 02 00");
    expect(created.emitterCompanyMail).toEqual("transporteur@test.fr");
    // packagins and volume are computed
    expect(created.emitterWastePackagings).toEqual(packaging);
    expect(created.emitterWasteVolume).toEqual(totalVolume);
    expect(created.transporterWastePackagings).toEqual(packaging);
    expect(created.transporterWasteVolume).toEqual(totalVolume);
    // synthesized emitter sirets are denormalized in `synthesisEmitterSirets`
    expect(created.synthesisEmitterSirets).toEqual([
      toAssociate1.emitterCompanySiret,
      toAssociate2.emitterCompanySiret
    ]);
    expect(created.groupingEmitterSirets).toEqual([]);
  });

  it("should forbid to mix grouping and synthesis arguments", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      name: "el transporteur",
      address: "playa del mar",
      companyTypes: {
        set: ["COLLECTOR", "TRANSPORTER"]
      }
    });

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: company.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const toAssociate2 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(3),
        transporterCompanySiret: company.siret,
        destinationCompanySiret: siretify(4),
        destinationOperationCode: "D10",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 6 },
          { type: "FUT", volume: 100, quantity: 3 }
        ],
        transporterWasteVolume: 30
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      transporter: {
        company: {
          name: "le transporteur",
          siret: company.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
          address: "avenue de la mer"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate1.id, toAssociate2.id]
    };

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );
    expect(data.createBsdasri.synthesizing?.map(bsd => bsd.id)).toEqual([
      toAssociate1.id,
      toAssociate2.id
    ]);
    expect(data.createBsdasri.type).toEqual("SYNTHESIS");
    const grouped1 = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: toAssociate1.id }
    });
    const grouped2 = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: toAssociate2.id }
    });
    expect(grouped1.synthesizedInId).toEqual(data.createBsdasri.id);

    expect(grouped2.synthesizedInId).toEqual(data.createBsdasri.id);

    const created = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: data.createBsdasri.id }
    });
    const packaging = [
      { type: "BOITE_CARTON", volume: 10, quantity: 9 },
      { type: "FUT", volume: 100, quantity: 3 }
    ];
    const totalVolume = 100 + 30;

    // transporter company fields are recorded on emitter too
    expect(created.type).toEqual("SYNTHESIS");
    expect(created.emitterCompanyName).toEqual("el transporteur");
    expect(created.emitterCompanySiret).toEqual(company.siret);
    expect(created.emitterCompanyContact).toEqual("jean durand");
    expect(created.emitterCompanyAddress).toEqual("playa del mar");
    expect(created.emitterCompanyPhone).toEqual("06 18 76 02 00");
    expect(created.emitterCompanyMail).toEqual("transporteur@test.fr");
    // packagins and volume are computed
    expect(created.emitterWastePackagings).toEqual(packaging);
    expect(created.emitterWasteVolume).toEqual(totalVolume);
    expect(created.transporterWastePackagings).toEqual(packaging);
    expect(created.transporterWasteVolume).toEqual(totalVolume);
    // synthesized emitter sirets are denormalized in `synthesisEmitterSirets`
    expect(created.synthesisEmitterSirets).toEqual([
      toAssociate1.emitterCompanySiret,
      toAssociate2.emitterCompanySiret
    ]);
    expect(created.groupingEmitterSirets).toEqual([]);
  });

  it("should forbid trader on synthesis dasri", async () => {
    const { company: trader } = await userWithCompanyFactory("MEMBER");

    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "el transporteur",
        address: "playa del mar",
        companyTypes: {
          set: ["COLLECTOR", "TRANSPORTER"]
        }
      }
    );
    const toAssociate = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: transporter.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      transporter: {
        company: {
          siret: transporter.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate.id],
      trader: {
        company: {
          siret: trader.siret,
          contact: "-",
          phone: "06 18 76 02 00"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le dasri de synthèse n'admet pas de courtier",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid broker on synthesis dasri", async () => {
    const { company: trader } = await userWithCompanyFactory("MEMBER");

    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "el transporteur",
        address: "playa del mar",
        companyTypes: {
          set: ["COLLECTOR", "TRANSPORTER"]
        }
      }
    );
    const toAssociate = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: transporter.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      transporter: {
        company: {
          siret: transporter.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate.id],
      broker: {
        company: {
          siret: trader.siret,
          contact: "-",
          phone: "06 18 76 02 00"
        }
      }
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le dasri de synthèse n'admet pas de négociant",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should forbid intermediaries on synthesis dasri", async () => {
    const intermediary = await companyFactory();

    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        name: "el transporteur",
        address: "playa del mar",
        companyTypes: {
          set: ["COLLECTOR", "TRANSPORTER"]
        }
      }
    );
    const toAssociate = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: transporter.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },

      transporter: {
        company: {
          siret: transporter.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate.id],
      intermediaries: [
        {
          siret: intermediary.siret,
          name: intermediary.name,
          address: intermediary.address,
          contact: intermediary.contact
        }
      ]
    };

    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le dasri de synthèse n'admet pas d'intermédiaires",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should allow a french transporter to create a synthesis DASRI", async () => {
    // Given
    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: {
          set: ["TRANSPORTER"]
        }
      }
    );

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanySiret: transporter.siret,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },
      transporter: {
        company: {
          name: "le transporteur",
          siret: transporter.siret,
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
          address: "avenue de la mer"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate1.id]
    };

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(1).toEqual(1);
  });

  it("should not allow a foreign transporter to create a synthesis DASRI", async () => {
    // Given
    const { user, company: transporter } = await userWithCompanyFactory(
      "MEMBER",
      {
        companyTypes: {
          set: ["TRANSPORTER"]
        },
        siret: null,
        vatNumber: "BE0406750197",
        orgId: "BE0406750197"
      }
    );

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: siretify(1),
        transporterCompanyVatNumber: transporter.vatNumber,
        destinationCompanySiret: siretify(2),
        destinationOperationCode: "D9",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 3 }
        ],
        transporterWasteVolume: 100
      }
    });

    const input = {
      waste: {
        adr: "xyz 33",
        code: "18 01 03*"
      },
      transporter: {
        company: {
          name: "le transporteur",
          siret: null, // Foreign transporter!
          vatNumber: transporter.vatNumber, // Foreign transporter!
          contact: "jean durand",
          phone: "06 18 76 02 00",
          mail: "transporteur@test.fr",
          address: "avenue de la mer"
        }
      },
      ...(await getDestinationCompanyInfo()),
      synthesizing: [toAssociate1.id]
    };

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createBsdasri">>(
      CREATE_DASRI,
      {
        variables: {
          input
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Un transporteur étranger ne peut pas créer de BSDASRI de synthèse"
    );
  });
});
