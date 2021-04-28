import { BsvhuStatus } from ".prisma/client";
import { BsvhuWhere } from "../../generated/graphql/types";
import { convertWhereToDbFilter } from "../where";

describe("Bsvhu where builder", () => {
  it("should throw if filters are deeply nested in OR", () => {
    const where: BsvhuWhere = {
      _and: [{ _and: [{ isDraft: true }] }]
    };
    expect(() => convertWhereToDbFilter(where)).toThrow();
  });

  it("should throw if filters are deeply nested in AND", () => {
    const where: BsvhuWhere = {
      _or: [{ _and: [{ isDraft: true }] }]
    };
    expect(() => convertWhereToDbFilter(where)).toThrow();
  });

  it("should convert basic filters to db filters", () => {
    const where: BsvhuWhere = {
      emitter: { company: { siret: "1234" } },
      destination: { company: { siret: "1234" } },
      transporter: { company: { siret: "1234" } }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter).toEqual({
      emitterCompanySiret: "1234",
      destinationCompanySiret: "1234",
      transporterCompanySiret: "1234"
    });
  });

  it("should convert complex filters to db filters", () => {
    const where: BsvhuWhere = {
      emitter: { company: { siret: "1234" } },
      _or: [{ isDraft: true }],
      _and: [{ status: BsvhuStatus.INITIAL }]
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter).toEqual({
      emitterCompanySiret: "1234",
      OR: [{ isDraft: true }],
      AND: [{ status: "INITIAL" }]
    });
  });

  it("should support ORing the same field", () => {
    const where: BsvhuWhere = {
      _or: [{ status: BsvhuStatus.PROCESSED }, { status: BsvhuStatus.INITIAL }]
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter).toEqual({
      OR: [{ status: "PROCESSED" }, { status: "INITIAL" }]
    });
  });

  it("should support date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter).toEqual({
      createdAt: { gt: now }
    });
  });

  it("should support several date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now, _lt: now }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter).toEqual({
      createdAt: { gt: now, lt: now }
    });
  });
});
