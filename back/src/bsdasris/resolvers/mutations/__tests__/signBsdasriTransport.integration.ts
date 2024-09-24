import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  companyFactory,
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  BsdasriStatus,
  BsdasriType,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToPublishData,
  readyToTakeOverData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { fullGroupingBsdasriFragment } from "../../../fragments";
import { gql } from "graphql-tag";

import { SIGN_DASRI } from "./signUtils";

const UPDATE_DASRI = gql`
  ${fullGroupingBsdasriFragment}
  mutation UpdateDasri($id: ID!, $input: BsdasriInput!) {
    updateBsdasri(id: $id, input: $input) {
      ...FullGroupingBsdasriFragment
    }
  }
`;

describe("Mutation.signBsdasri transport", () => {
  afterAll(resetDatabase);

  it("should put transport signature on a SIGNED_BY_PRODUCER dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    await transporterReceiptFactory({ company: transporterCompany });
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur",
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should put transport signature on a SIGNED_BY_PRODUCER dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        transporterRecepisseIsExempted: true,
        emitterEmissionSignatureAuthor: "Producteur",
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should not allow the transport signature when recepisse is absent", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur",
        status: BsdasriStatus.SIGNED_BY_PRODUCER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });
    expect(errors[0].message).toMatch(
      "Transporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
    expect(errors[0].message).toMatch(
      "Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
    expect(errors[0].message).toMatch(
      "Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets"
    );
  });

  it("should mark a dasri as refused when transporter acceptation is refused", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        transporterAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporterWasteRefusalReason: "J'en veux pas",
        transporterWasteRefusedWeightValue: 66,
        transporterRecepisseIsExempted: true,
        status: BsdasriStatus.SIGNED_BY_PRODUCER,
        emitterEmissionSignatureDate: new Date(),
        emitterEmissionSignatureAuthor: "Producteur"
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("REFUSED");
    expect(readyTotakeOverDasri.transporterTransportSignatureAuthor).toEqual(
      "Jimmy"
    );
    expect(readyTotakeOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  // Transport mode is now required at transporter signature step
  describe("transporterTransportMode", () => {
    // Create dasri
    const prepareBsdasriAndSignTransport = async (createOpt, updateOpt?) => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      const { company: destinationCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      await transporterReceiptFactory({ company: transporterCompany });
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          emitterEmissionSignatureDate: new Date(),
          emitterEmissionSignatureAuthor: "Producteur",
          status: BsdasriStatus.SIGNED_BY_PRODUCER,
          transporterTransportMode: null,
          ...createOpt
        }
      });

      // Update ?
      const { mutate } = makeClient(transporter);
      if (updateOpt) {
        const { errors } = await mutate<Pick<Mutation, "updateBsdasri">>(
          UPDATE_DASRI,
          {
            variables: {
              id: dasri.id,
              input: {
                ...updateOpt
              }
            }
          }
        );

        expect(errors).toBeUndefined();
      }

      // Sign transport
      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: dasri.id,
            input: { type: "TRANSPORT", author: "Jimmy" }
          }
        }
      );

      const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: dasri.id }
      });

      return { errors, bsdasri: updatedBsdasri };
    };

    it("should throw error if transport mode is not defined", async () => {
      // When
      const { errors } = await prepareBsdasriAndSignTransport({});

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Le mode de transport est obligatoire.");
    });

    it("should work if transport mode is in initial BSD", async () => {
      // When
      const { errors, bsdasri } = await prepareBsdasriAndSignTransport({
        transporterTransportMode: TransportMode.ROAD
      });

      // Then
      expect(errors).toBeUndefined();
      expect(bsdasri.transporterTransportMode).toBe(TransportMode.ROAD);
    });

    it("should work if transport mode is given before transporter signature", async () => {
      // When
      const { errors, bsdasri } = await prepareBsdasriAndSignTransport(
        {},
        {
          transporter: {
            transport: {
              mode: TransportMode.ROAD
            }
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(bsdasri.transporterTransportMode).toBe(TransportMode.ROAD);
    });

    it("should throw error if transport mode is unset before signature", async () => {
      // When
      const { errors } = await prepareBsdasriAndSignTransport(
        {
          transporterTransportMode: TransportMode.AIR
        },
        {
          transporter: {
            transport: {
              mode: null
            }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Le mode de transport est obligatoire.");
    });

    it("transport mode is not required for synthesis DASRI", async () => {
      // Given
      const { company: initialCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      await transporterReceiptFactory({ company: transporterCompany });
      const { company: destinationCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const mainCompany = await companyFactory();
      const initialBsdasri = await bsdasriFactory({
        opt: {
          ...initialData(initialCompany)
        }
      });
      const synthesisBsdasri = await bsdasriFactory({
        opt: {
          type: BsdasriType.SYNTHESIS,
          ...initialData(mainCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.SIGNED_BY_PRODUCER,
          synthesizing: { connect: [{ id: initialBsdasri.id }] },
          transporterTransportMode: null
        }
      });

      // When
      const { mutate } = makeClient(transporter);
      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: synthesisBsdasri.id,
            input: { type: "TRANSPORT", author: "Jimmy" }
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
    });
  });
});
