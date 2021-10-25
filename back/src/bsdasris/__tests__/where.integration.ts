import { BsdasriStatus } from "@prisma/client";
import { BsdasriWhere } from "../../generated/graphql/types";
import { toPrismaWhereInput } from "../where";

describe("Bsdasri where conversion", () => {
  it("should convert filter on sirets", () => {
    const where: BsdasriWhere = {
      emitter: { company: { siret: { _eq: "emitterSiret" } } },
      transporter: { company: { siret: { _eq: "transporterSiret" } } },
      destination: { company: { siret: { _eq: "destinationSiret" } } }
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      emitterCompanySiret: { equals: "emitterSiret" },
      transporterCompanySiret: { equals: "transporterSiret" },
      destinationCompanySiret: { equals: "destinationSiret" }
    });
  });
  it("should convert filter on operations _eq", () => {
    const where: BsdasriWhere = {
      destination: {
        operation: {
          code: { _eq: "D9" }
        }
      }
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      destinationOperationCode: { equals: "D9" }
    });
  });
  it("should convert filter on operations _in", () => {
    const where: BsdasriWhere = {
      destination: {
        operation: {
          code: { _in: ["D9", "R1"] }
        }
      }
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      destinationOperationCode: { in: ["D9", "R1"] }
    });
  });

  it("should convert filter on status _in and draftitude", () => {
    const where: BsdasriWhere = {
      status: { _in: [BsdasriStatus.PROCESSED, BsdasriStatus.SENT] },
      isDraft: false
    };

    const prismaWhere = toPrismaWhereInput(where);

    expect(prismaWhere).toEqual({
      status: { in: ["PROCESSED", "SENT"] },
      isDraft: false
    });
  });

  it("should convert filter on status _eq and draftitude", () => {
    const where: BsdasriWhere = {
      status: { _eq: BsdasriStatus.PROCESSED },
      isDraft: true
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      status: { equals: "PROCESSED" },
      isDraft: true
    });
  });

  it("should convert filter on groupable true", () => {
    const where: BsdasriWhere = {
      groupable: true
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      grouping: { none: {} },
      type: "SIMPLE",
      groupedInId: null
    });
  });

  it("should convert filter on groupable false", () => {
    const where: BsdasriWhere = {
      groupable: false
    };

    const prismaWhere = toPrismaWhereInput(where);

    expect(prismaWhere).toEqual({
      OR: [
        { grouping: { some: {} } },
        { groupedInId: { not: null } },
        { type: { not: "SIMPLE" } }
      ]
    });
  });

  it("should convert complex filters to db filters", () => {
    const where: BsdasriWhere = {
      _or: [
        { status: { _eq: BsdasriStatus.RECEIVED } },
        { status: { _eq: BsdasriStatus.PROCESSED } }
      ],
      _and: [
        { emitter: { company: { siret: { _eq: "emitterSiret" } } } },
        { destination: { company: { siret: { _eq: "destinationSiret" } } } }
      ]
    };

    const prismaWhere = toPrismaWhereInput(where);

    expect(prismaWhere).toEqual({
      OR: [
        { status: { equals: "RECEIVED" } },
        { status: { equals: "PROCESSED" } }
      ],
      AND: [
        { emitterCompanySiret: { equals: "emitterSiret" } },
        { destinationCompanySiret: { equals: "destinationSiret" } }
      ]
    });
  });

  it("should convert  date specific filters", () => {
    const now = new Date();
    const where: BsdasriWhere = {
      createdAt: { _gt: now, _lt: now }
    };

    const prismaWhere = toPrismaWhereInput(where);

    expect(prismaWhere).toEqual({
      createdAt: { gt: now, lt: now }
    });
  });

  it("should convert filter on request id (id _eq)", () => {
    const where: BsdasriWhere = {
      id: { _eq: "x" }
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      id: { equals: "x" }
    });
  });
  it("should convert filter on request ids (id _in)", () => {
    const where: BsdasriWhere = {
      id: { _in: ["x", "y", "z"] }
    };

    const prismaWhere = toPrismaWhereInput(where);
    expect(prismaWhere).toEqual({
      id: { in: ["x", "y", "z"] }
    });
  });
});
