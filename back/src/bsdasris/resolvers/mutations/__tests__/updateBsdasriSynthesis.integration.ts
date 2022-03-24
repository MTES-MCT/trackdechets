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

  it("should set dasri type to SYNTHESIS", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER", {
        companyTypes: {
          set: ["COLLECTOR"]
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
        status: BsdasriStatus.INITIAL
      }
    });

    const { mutate } = makeClient(transporter);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { synthesizing: [toAssociate.id] }
        }
      }
    );

    expect(data.updateBsdasri.synthesizing).toEqual([{ id: toAssociate.id }]);
    expect(data.updateBsdasri.type).toEqual("SYNTHESIS");

    const updatedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id },
      include: { synthesizing: true }
    });
    expect(updatedDasri.type).toEqual("SYNTHESIS");

    expect(updatedDasri.synthesizing.map(el => el.id)).toEqual([
      toAssociate.id
    ]);
  });

  it("should set dasri type to SIMPLE when removing associated bsd", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");

    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");

    // this dasri will be grouped by the synthesis dasris
    const synthesizeBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),

        status: BsdasriStatus.SENT
      }
    });

    // synthesis dasris
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),

        type: BsdasriType.SYNTHESIS,

        synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
      }
    });

    const { mutate } = makeClient(transporter);

    const { data } = await mutate<Pick<Mutation, "updateBsdasri">>(
      UPDATE_DASRI,
      {
        variables: {
          id: dasri.id,
          input: { synthesizing: null }
        }
      }
    );

    expect(data.updateBsdasri.type).toEqual("SIMPLE");
    expect(data.updateBsdasri.synthesizing).toEqual([]);

    const updatedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id },
      include: { synthesizing: true }
    });
    expect(updatedDasri.type).toEqual("SIMPLE");

    expect(updatedDasri.synthesizing).toEqual([]);
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

      await mutate<Pick<Mutation, "updateBsdasri">>(UPDATE_DASRI, {
        variables: {
          id: dasri.id,
          input: { destination: { operation: { code: "D10" } } }
        }
      });

      const updatedDasri = await prisma.bsdasri.findUnique({
        where: { id: dasri.id }
      });
      expect(updatedDasri.type).toEqual("SYNTHESIS");
      expect(updatedDasri.destinationOperationCode).toEqual("D10");
    }
  );
});
