import { BsdasriStatus } from "@prisma/client";
import { BsdasriWhere } from "../../../../generated/graphql/types";
import { buildDbFilter } from "../where";

const siret = "11112345611111";

describe("Bsdasri where conversion", () => {
  it.each(["_or", "_and"])("should forbid nested filters in %p", cond => {
    const where: BsdasriWhere = {
      [cond]: [{ _and: [{ isDraft: true }] }]
    };
    expect(() => buildDbFilter(where, [siret])).toThrow();
  });

  it("should convert filter on sirets", () => {
    const where: BsdasriWhere = {
      emitter: { company: { siret: "emitterSiret" } },
      transporter: { company: { siret: "transporterSiret" } },
      destination: { company: { siret: "destinationSiret" } }
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],
      emitterCompanySiret: "emitterSiret",
      transporterCompanySiret: "transporterSiret",
      destinationCompanySiret: "destinationSiret"
    });
  });

  it("should convert filter on operations", () => {
    const where: BsdasriWhere = {
      destinationOperationCode: ["D9", "R1"]
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],

      destinationOperationCode: { in: ["D9", "R1"] }
    });
  });

  it("should convert filter on status and draftitude", () => {
    const where: BsdasriWhere = {
      status: BsdasriStatus.PROCESSED,
      isDraft: true
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],
      status: "PROCESSED",
      isDraft: true
    });
  });

  it("should convert filter on groupable aptitude", () => {
    const where: BsdasriWhere = {
      groupable: true
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],
      grouping: { none: {} },
      groupingIn: null
    });
  });
  it("should convert complex filters to db filters", () => {
    const where: BsdasriWhere = {
      _or: [
        { status: BsdasriStatus.RECEIVED },
        { status: BsdasriStatus.PROCESSED }
      ],
      _and: [
        { emitter: { company: { siret: "emitterSiret" } } },
        { destination: { company: { siret: "destinationSiret" } } }
      ]
    };

    const dbFilter = buildDbFilter(where, [siret]);

    expect(dbFilter).toEqual({
      OR: [{ status: "RECEIVED" }, { status: "PROCESSED" }],
      AND: [
        { emitterCompanySiret: "emitterSiret" },
        { destinationCompanySiret: "destinationSiret" }
      ]
    });
  });

  it("should convert  date specific filters", () => {
    const now = new Date();
    const where: BsdasriWhere = {
      createdAt: { _gt: now, _lt: now }
    };

    const dbFilter = buildDbFilter(where, [siret]);

    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],
      createdAt: { gt: now, lt: now }
    });
  });

  it("should convert filter on request ids (id_in)", () => {
    const where: BsdasriWhere = {
      id_in: ["x", "y", "z"]
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { destinationCompanySiret: { in: [siret] } }
      ],
      id: { in: ["x", "y", "z"] }
    });
  });
});
