import { BsdasriStatus } from ".prisma/client";
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
      recipient: { company: { siret: "recipientSiret" } }
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { recipientCompanySiret: { in: [siret] } }
      ],
      emitterCompanySiret: "emitterSiret",
      transporterCompanySiret: "transporterSiret",
      recipientCompanySiret: "recipientSiret"
    });
  });

  it("should convert filter on operations", () => {
    const where: BsdasriWhere = {
      processingOperation: ["D9", "R1"]
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { recipientCompanySiret: { in: [siret] } }
      ],

      processingOperation: { in: ["D9", "R1"] }
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
        { recipientCompanySiret: { in: [siret] } }
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
        { recipientCompanySiret: { in: [siret] } }
      ],
      regroupedBsdasris: { none: {} },
      regroupedOnBsdasri: null
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
        { recipient: { company: { siret: "recipientSiret" } } }
      ]
    };

    const dbFilter = buildDbFilter(where, [siret]);

    expect(dbFilter).toEqual({
      OR: [{ status: "RECEIVED" }, { status: "PROCESSED" }],
      AND: [
        { emitterCompanySiret: "emitterSiret" },
        { recipientCompanySiret: "recipientSiret" }
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
        { recipientCompanySiret: { in: [siret] } }
      ],
      createdAt: { gt: now, lt: now }
    });
  });

  it("should convert filter on request ids", () => {
    const where: BsdasriWhere = {
      ids: ["x", "y", "z"]
    };

    const dbFilter = buildDbFilter(where, [siret]);
    expect(dbFilter).toEqual({
      OR: [
        { emitterCompanySiret: { in: [siret] } },
        { transporterCompanySiret: { in: [siret] } },
        { recipientCompanySiret: { in: [siret] } }
      ],
      id: { in: ["x", "y", "z"] }
    });
  });
});
