import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userWithCompanyFactory,
  userFactory,
  formFactory
} from "../../../../__tests__/factories";
import { bsdasriFactory } from "../../../../bsdasris/__tests__/factories";
import { bsdaFactory } from "../../../../bsda/__tests__/factories";
import { bsvhuFactory } from "../../../../bsvhu/__tests__/factories.vhu";
import { createBsff } from "../../../../bsffs/__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { ErrorCode } from "../../../../common/errors";
import { Mutation } from "../../../../generated/graphql/types";
import {
  BsdType,
  Status,
  BsdaStatus,
  BsdasriStatus,
  BsffStatus,
  BsvhuStatus
} from "@prisma/client";
import { addMinutes } from "date-fns";

const CREATE_PDF_TOKEN = `
mutation CreatePdfAccessToken($input: CreatePdfAccessTokenInput!) {
  createPdfAccessToken(  input: $input)  
}`;

describe("Mutation.creatPdfAccessToken", () => {
  afterEach(resetDatabase);

  it("should deny token creation if id does not exist", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const user = await userFactory();
    await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: company.siret, number: 1 }
        }
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: "abcdef" }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should deny token creation for a bsdd if user does not belong to it", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const user = await userFactory();
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: company.siret, number: 1 }
        },
        status: Status.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsdd.id }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should deny bsdd token creation for non SENT status", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: company.siret, number: 1 }
        },
        status: Status.RECEIVED
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsdd.id }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux pris en charge par un transporteur peuvent être consulté via un accès temporaire.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should create a token for a bsdd", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: { transporterCompanySiret: company.siret, number: 1 }
        },
        status: Status.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsdd.id }
        }
      }
    );

    const token = await prisma.pdfAccessToken.findFirstOrThrow({
      where: { bsdType: BsdType.BSDD, userId: user.id, bsdId: bsdd.id }
    });

    expect(data.createPdfAccessToken).toEqual(
      `http://api.trackdechets.local/road-control/${token.token}`
    );
    // token lifespan should be 30'
    expect(token.expiresAt.getTime() > addMinutes(new Date(), 29).getTime());
  });
  it("should deny token creation for a bsda if user does not belong to it", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const user = await userFactory();
    const bsda = await bsdaFactory({
      opt: {
        status: BsdaStatus.SENT
      },
      transporterOpt: {
        transporterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsda.id }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should deny bsda token creation for non SENT status", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: BsdaStatus.PROCESSED
      },
      transporterOpt: {
        transporterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsda.id }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux pris en charge par un transporteur peuvent être consulté via un accès temporaire.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should create a token for a bsda", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsda = await bsdaFactory({
      opt: {
        status: BsdaStatus.SENT
      },
      transporterOpt: {
        transporterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsda.id }
        }
      }
    );

    const token = await prisma.pdfAccessToken.findFirstOrThrow({
      where: { bsdType: BsdType.BSDA, userId: user.id, bsdId: bsda.id }
    });

    expect(data.createPdfAccessToken).toEqual(
      `http://api.trackdechets.local/road-control/${token.token}`
    );
    // token lifespan should be 30'
    expect(token.expiresAt.getTime() > addMinutes(new Date(), 29).getTime());
  });
  it("should deny token creation for a bsdasri if user does not belong to it", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const user = await userFactory();
    const dasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsdasriStatus.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: dasri.id }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should deny bsdasri token creation for non SENT status", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: dasri.id }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux pris en charge par un transporteur peuvent être consulté via un accès temporaire.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should create a token for a bsdasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsdasriStatus.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: dasri.id }
        }
      }
    );

    const token = await prisma.pdfAccessToken.findFirstOrThrow({
      where: { bsdType: BsdType.BSDASRI, userId: user.id, bsdId: dasri.id }
    });

    expect(data.createPdfAccessToken).toEqual(
      `http://api.trackdechets.local/road-control/${token.token}`
    );
    // token lifespan should be 30'
    expect(token.expiresAt.getTime() > addMinutes(new Date(), 29).getTime());
  });
  it("should deny token creation for a bsff if user does not belong to it", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const currentUser = await userFactory();
    const bsff = await createBsff(
      { emitter: { user, company } },
      { data: { status: BsffStatus.SENT } }
    );
    const { mutate } = makeClient(currentUser);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsff.id }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas accéder à ce BSFF",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should deny bsff token creation for non SENT status", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff(
      { emitter: { user, company } },
      { data: { status: BsffStatus.RECEIVED } }
    );
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsff.id }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux pris en charge par un transporteur peuvent être consulté via un accès temporaire.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should create a token for a bsff", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const bsff = await createBsff(
      { emitter: { user, company } },
      { data: { status: BsffStatus.SENT } }
    );
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: bsff.id }
        }
      }
    );

    const token = await prisma.pdfAccessToken.findFirstOrThrow({
      where: { bsdType: BsdType.BSFF, userId: user.id, bsdId: bsff.id }
    });

    expect(data.createPdfAccessToken).toEqual(
      `http://api.trackdechets.local/road-control/${token.token}`
    );
    // token lifespan should be 30'
    expect(token.expiresAt.getTime() > addMinutes(new Date(), 29).getTime());
  });
  it("should deny token creation for a bsvhu if user does not belong to it", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const user = await userFactory();
    const vhu = await bsvhuFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsvhuStatus.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: vhu.id }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à accéder à ce bordereau",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should deny bsvhu token creation for non SENT status", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const vhu = await bsvhuFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsvhuStatus.PROCESSED
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: vhu.id }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux pris en charge par un transporteur peuvent être consulté via un accès temporaire.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should create a token for a bsvhu", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const vhu = await bsvhuFactory({
      opt: {
        transporterCompanySiret: company.siret,
        status: BsvhuStatus.SENT
      }
    });
    const { mutate } = makeClient(user);

    const { data } = await mutate<Pick<Mutation, "createPdfAccessToken">>(
      CREATE_PDF_TOKEN,
      {
        variables: {
          input: { bsdId: vhu.id }
        }
      }
    );

    const token = await prisma.pdfAccessToken.findFirstOrThrow({
      where: { bsdType: BsdType.BSVHU, userId: user.id, bsdId: vhu.id }
    });

    expect(data.createPdfAccessToken).toEqual(
      `http://api.trackdechets.local/road-control/${token.token}`
    );
    // token lifespan should be 30'
    expect(token.expiresAt.getTime() > addMinutes(new Date(), 29).getTime());
  });
});
