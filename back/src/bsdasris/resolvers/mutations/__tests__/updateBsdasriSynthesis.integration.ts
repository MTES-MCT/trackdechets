import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, BsdasriType, CompanyType } from "@prisma/client";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData,
  readyToTakeOverData
} from "../../../__tests__/factories";
import { Mutation } from "../../../../generated/graphql/types";

const UPDATE_DASRI = `
mutation UpdateDasri($id: ID!, $input: BsdasriInput!) {
  updateBsdasri(id: $id, input: $input) {
    id
    status
    type
    emitter {
       company {
          mail
        }
      }
      synthesizing { id }

  }
}`;
describe("Mutation.updateBsdasri", () => {
  afterEach(resetDatabase);
  it("should allow associated bsds update on INITIAL synthesis dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const destinationCompany = await companyFactory();

    const associated = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });

    const initialPackagings = [
      { type: "BOITE_CARTON", volume: 10, quantity: 9 },
      { type: "FUT", volume: 100, quantity: 3 }
    ];

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: associated.id }] },
        emitterWastePackagings: initialPackagings,
        emitterWasteVolume: 1234,
        transporterWastePackagings: initialPackagings,
        transporterWasteVolume: 1234
      }
    });

    const { mutate } = makeClient(transporter);
    const emitterCompanySiret = siretify(2);
    const destinationCompanySiret = siretify(3);
    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret,
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret,
        destinationOperationCode: "D10",
        destinationOperationMode: "ELIMINATION",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 6 },
          { type: "FUT", volume: 100, quantity: 3 }
        ],
        transporterWasteVolume: 30
      }
    });
    const toAssociate2 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret,
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret,
        destinationOperationCode: "D10",
        destinationOperationMode: "ELIMINATION",
        transporterWastePackagings: [
          { type: "BOITE_CARTON", volume: 10, quantity: 10 },
          { type: "FUT", volume: 100, quantity: 10 },
          { type: "BOITE_PERFORANTS", volume: 5, quantity: 11 }
        ],
        transporterWasteVolume: 100
      }
    });

    await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
      variables: {
        id: dasri.id,
        input: { synthesizing: [toAssociate1.id, toAssociate2.id] }
      }
    });

    const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: {
        synthesizing: { select: { id: true } }
      }
    });

    const aggregatedPackagings = [
      { type: "BOITE_CARTON", volume: 10, quantity: 16 },
      { type: "FUT", volume: 100, quantity: 13 },
      { type: "BOITE_PERFORANTS", volume: 5, quantity: 11 }
    ];
    const summedVolume = 100 + 30;
    expect(updatedDasri.type).toEqual("SYNTHESIS");
    expect(updatedDasri.synthesizing).toEqual(
      expect.arrayContaining([{ id: toAssociate1.id }, { id: toAssociate2.id }])
    );

    expect(updatedDasri.emitterWastePackagings).toEqual(aggregatedPackagings);
    expect(updatedDasri.emitterWasteVolume).toEqual(summedVolume);
    expect(updatedDasri.transporterWastePackagings).toEqual(
      aggregatedPackagings
    );
    expect(updatedDasri.transporterWasteVolume).toEqual(summedVolume);

    // synthesized emitter sirets are denormalized in `synthesisEmitterSirets`
    expect(updatedDasri.synthesisEmitterSirets).toEqual([emitterCompanySiret]);
    expect(updatedDasri.groupingEmitterSirets).toEqual([]);
  });

  it("should forbid empty associated bsds fields on INITIAL synthesis dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const associated = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });

    const initialPackagings = [
      { type: "BOITE_CARTON", volume: 10, quantity: 9 },
      { type: "FUT", volume: 100, quantity: 3 }
    ];

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: associated.id }] },
        emitterWastePackagings: initialPackagings,
        emitterWasteVolume: 1234,
        transporterWastePackagings: initialPackagings,
        transporterWasteVolume: 1234
      }
    });

    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { synthesizing: [] }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Un bordereau de synthèse doit comporter des bordereaux associés",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should forbid null associated bsds fields on INITIAL synthesis dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const associated = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL
      }
    });

    const initialPackagings = [
      { type: "BOITE_CARTON", volume: 10, quantity: 9 },
      { type: "FUT", volume: 100, quantity: 3 }
    ];

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: associated.id }] },
        emitterWastePackagings: initialPackagings,
        emitterWasteVolume: 1234,
        transporterWastePackagings: initialPackagings,
        transporterWasteVolume: 1234
      }
    });

    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { synthesizing: null }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Un bordereau de synthèse doit comporter des bordereaux associés",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it.each([
    BsdasriStatus.SENT,
    BsdasriStatus.RECEIVED,
    BsdasriStatus.PROCESSED
  ])("should forbid associated bsds update on non %p dasri", async status => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    const associated = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: status
      }
    });

    const toAssociate = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.SENT
      }
    });
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.SENT,
        type: BsdasriType.SYNTHESIS,
        synthesizing: { connect: [{ id: associated.id }] }
      }
    });

    const { mutate } = makeClient(transporter);

    const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { synthesizing: [toAssociate.id] }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Les bordereaux associés à ce bsd ne sont plus modifiables",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([BsdasriStatus.SENT, BsdasriStatus.RECEIVED])(
    "should allow field update on non %p dasri",
    async status => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");

      const destinationCompany = await companyFactory();

      const associated = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          status: status
        }
      });
      const packagings = [
        { type: "BOITE_CARTON", volume: 10, quantity: 9 },
        { type: "FUT", volume: 100, quantity: 3 }
      ];
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(transporterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.SENT,
          type: BsdasriType.SYNTHESIS,
          synthesizing: { connect: [{ id: associated.id }] },
          emitterWastePackagings: packagings,
          emitterWasteVolume: 1234,
          transporterWastePackagings: packagings,
          transporterWasteVolume: 1234
        }
      });

      const { mutate } = makeClient(transporter);

      await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
        variables: {
          id: dasri.id,
          input: {
            destination: { operation: { code: "D10", mode: "ELIMINATION" } }
          }
        }
      });

      const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: dasri.id },
        include: {
          synthesizing: { select: { id: true } }
        }
      });
      expect(updatedDasri.type).toEqual("SYNTHESIS");
      expect(updatedDasri.emitterWastePackagings).toEqual(packagings);
      expect(updatedDasri.emitterWasteVolume).toEqual(1234);
      expect(updatedDasri.transporterWastePackagings).toEqual(packagings);
      expect(updatedDasri.transporterWasteVolume).toEqual(1234);
      expect(updatedDasri.synthesizing).toEqual([{ id: associated.id }]);
      expect(updatedDasri.destinationOperationCode).toEqual("D10");
      expect(updatedDasri.destinationOperationMode).toEqual("ELIMINATION");
    }
  );

  it.each([
    ["R12", undefined],
    ["D12", "ELIMINATION"]
  ])(
    "should forbid %p operation code on synthesis dasri",
    async (operationCode, operationMode) => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      const destinationCompany = await companyFactory({
        companyTypes: {
          set: [CompanyType.COLLECTOR]
        }
      });
      const associated = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.INITIAL
        }
      });

      const initialPackagings = [
        { type: "BOITE_CARTON", volume: 10, quantity: 9 },
        { type: "FUT", volume: 100, quantity: 3 }
      ];

      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),

          status: BsdasriStatus.RECEIVED,
          type: BsdasriType.SYNTHESIS,
          synthesizing: { connect: [{ id: associated.id }] },
          emitterWastePackagings: initialPackagings,
          emitterWasteVolume: 1234,
          transporterWastePackagings: initialPackagings,
          transporterWasteVolume: 1234
        }
      });

      const { mutate } = makeClient(transporter);

      const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
        UPDATE_DASRI,
        {
          variables: {
            id: dasri.id,
            input: {
              destination: {
                operation: { code: operationCode, mode: operationMode }
              }
            }
          }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Les codes R12 et D12 sont interdits sur un bordereau de synthèse",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it.each([
    ["D9", "ELIMINATION"],
    ["D10", "ELIMINATION"],
    ["R1", "VALORISATION_ENERGETIQUE"]
  ])(
    "should allow %p operation code on synthesis dasri",
    async (operationCode, operationMode) => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      const destinationCompany = await companyFactory({
        companyTypes: {
          set: [CompanyType.COLLECTOR]
        }
      });
      const associated = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.INITIAL
        }
      });

      const initialPackagings = [
        { type: "BOITE_CARTON", volume: 10, quantity: 9 },
        { type: "FUT", volume: 100, quantity: 3 }
      ];

      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),

          status: BsdasriStatus.RECEIVED,
          type: BsdasriType.SYNTHESIS,
          synthesizing: { connect: [{ id: associated.id }] },
          emitterWastePackagings: initialPackagings,
          emitterWasteVolume: 1234,
          transporterWastePackagings: initialPackagings,
          transporterWasteVolume: 1234
        }
      });

      const { mutate } = makeClient(transporter);

      await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
        variables: {
          id: dasri.id,
          input: {
            destination: {
              operation: { code: operationCode, mode: operationMode }
            }
          }
        }
      });

      const updatedDasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: dasri.id }
      });
      expect(updatedDasri.destinationOperationCode).toEqual(operationCode);
      expect(updatedDasri.destinationOperationMode).toEqual(operationMode);
    }
  );
});
