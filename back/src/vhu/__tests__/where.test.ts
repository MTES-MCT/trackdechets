import { VhuStatus } from ".prisma/client";
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
      recipient: { company: { siret: "1234" } },
      transporter: { company: { siret: "1234" } }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter["emitterCompanySiret"]).toBe("1234");
    expect(dbFilter["recipientCompanySiret"]).toBe("1234");
    expect(dbFilter["transporterCompanySiret"]).toBe("1234");
  });

  it("should convert complex filters to db filters", () => {
    const where: BsvhuWhere = {
      emitter: { company: { siret: "1234" } },
      _or: [{ isDraft: true }],
      _and: [{ status: VhuStatus.DONE }]
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter["emitterCompanySiret"]).toBe("1234");
    expect(dbFilter["OR"][0]["isDraft"]).toBe(true);
    expect(dbFilter["AND"][0]["status"]).toBe("DONE");
  });

  it("should support ORing the same field", () => {
    const where: BsvhuWhere = {
      _or: [{ status: VhuStatus.DONE }, { status: VhuStatus.IN_PROGRESS }]
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter["OR"][0]["status"]).toBe("DONE");
    expect(dbFilter["OR"][1]["status"]).toBe("IN_PROGRESS");
  });

  it("should support date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter["createdAt"]["gt"]).toBe(now);
  });

  it("should support several date specific filters", () => {
    const now = new Date();
    const where: BsvhuWhere = {
      createdAt: { _gt: now, _lt: now }
    };

    const dbFilter = convertWhereToDbFilter(where);

    expect(dbFilter["createdAt"]["gt"]).toBe(now);
    expect(dbFilter["createdAt"]["lt"]).toBe(now);
  });
});
