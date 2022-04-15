import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, BsdasriType } from "@prisma/client";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  bsdasriFactory,
  initialData,
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

    const toAssociate1 = await bsdasriFactory({
      opt: {
        status: BsdasriStatus.SENT,
        emitterCompanySiret: "7654",
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret: "2689",
        destinationOperationCode: "D10",
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
        emitterCompanySiret: "7654",
        transporterCompanySiret: transporterCompany.siret,
        destinationCompanySiret: "2689",
        destinationOperationCode: "D10",
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

    const updatedDasri = await prisma.bsdasri.findUnique({
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
    expect(updatedDasri.synthesizing).toEqual([
      { id: toAssociate1.id },
      { id: toAssociate2.id }
    ]);

    expect(updatedDasri.emitterWastePackagings).toEqual(aggregatedPackagings);
    expect(updatedDasri.emitterWasteVolume).toEqual(summedVolume);
    expect(updatedDasri.transporterWastePackagings).toEqual(
      aggregatedPackagings
    );
    expect(updatedDasri.transporterWasteVolume).toEqual(summedVolume);
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

      const associated = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
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
          input: { destination: { operation: { code: "D10" } } }
        }
      });

      const updatedDasri = await prisma.bsdasri.findUnique({
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
      expect(updatedDasri.synthesizing).toEqual("D10");
    }
  );
});
