import { BsvhuStatus } from "@prisma/client";
import { BsvhuWhere } from "../../generated/graphql/types";
import { toPrismaWhereInput } from "../where";

describe("Bsvhu where builder", () => {
  it("should throw if filters are deeply nested in OR", () => {
    const where: BsvhuWhere = {
      _and: [{ _and: [{ isDraft: true }] }]
    };
    expect(() => toPrismaWhereInput(where)).toThrow();
  });

  it("should throw if filters are deeply nested in AND", () => {
    const where: BsvhuWhere = {
      _or: [{ _and: [{ isDraft: true }] }]
    };
    expect(() => toPrismaWhereInput(where)).toThrow();
  });

  it("should convert string filters to db filters", () => {
    const where: BsvhuWhere = {
      emitter: { company: { siret: { _eq: "1234" } } },
      destination: { company: { siret: { _eq: "1234" } } },
      transporter: { company: { siret: { _eq: "1234" } } }
    };

    const dbFilter = toPrismaWhereInput(where);

    expect(dbFilter).toEqual({
      emitterCompanySiret: { equals: "1234" },
      destinationCompanySiret: { equals: "1234" },
      transporterCompanySiret: { equals: "1234" }
    });
  });

  it("should convert complex filters to db filters", () => {
    const where: BsvhuWhere = {
      emitter: { company: { siret: { _eq: "1234" } } },
      _or: [{ isDraft: true }],
      _and: [{ status: { _eq: BsvhuStatus.INITIAL } }]
    };

    const dbFilter = toPrismaWhereInput(where);

    expect(dbFilter).toEqual({
      emitterCompanySiret: { equals: "1234" },
      OR: [{ isDraft: true }],
      AND: [{ status: { equals: "INITIAL" } }]
    });
  });

  it("should support ORing the same field", () => {
    const where: BsvhuWhere = {
      _or: [
        { status: { _eq: BsvhuStatus.PROCESSED } },
        { status: { _eq: BsvhuStatus.INITIAL } }
      ]
    };

    const dbFilter = toPrismaWhereInput(where);

    expect(dbFilter).toEqual({
      OR: [
        { status: { equals: "PROCESSED" } },
        { status: { equals: "INITIAL" } }
      ]
    });
  });

  it("should support date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now }
    };

    const dbFilter = toPrismaWhereInput(where);

    expect(dbFilter).toEqual({
      createdAt: { gt: now }
    });
  });

  it("should support several date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now, _lt: now }
    };

    const dbFilter = toPrismaWhereInput(where);

    expect(dbFilter).toEqual({
      createdAt: { gt: now, lt: now }
    });
  });
});
