import { ErrorCode } from "../../../common/errors";
import * as workflow from "../../workflow";
import { signedByTransporter } from "../mark-as";

describe("Forms -> markAsSealed mutation", () => {
  const formMock = jest.fn();
  const prisma = {
    form: formMock,
    updateForm: jest.fn(() => Promise.resolve({})),
    createForm: jest.fn(() => Promise.resolve({})),
    createStatusLog: jest.fn(() => Promise.resolve({})),
    updateManyForms: jest.fn(() => Promise.resolve({})),
    $exists: {
      company: jest.fn(() => Promise.resolve(false))
    }
  };

  const getNextPossibleStatusMock = jest.spyOn(
    workflow,
    "getNextPossibleStatus"
  );

  const defaultContext = {
    prisma,
    user: { id: "userId" },
    request: null
  } as any;

  beforeEach(() => {
    Object.keys(prisma).forEach(
      key => prisma[key].mockClear && prisma[key].mockClear()
    );
    getNextPossibleStatusMock.mockReset();
  });

  it("should fail when if its not signed by producer", async () => {
    expect.assertions(1);
    try {
      getNextPossibleStatusMock.mockResolvedValue(["SENT"]);
      prisma.form.mockResolvedValue({ id: 1 });

      await signedByTransporter(
        null,
        { id: 1, signingInfo: { signedByTransporter: true } },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when if its not signed by transporter", async () => {
    expect.assertions(1);
    try {
      getNextPossibleStatusMock.mockResolvedValue(["SENT"]);
      prisma.form.mockResolvedValue({ id: 1 });

      await signedByTransporter(
        null,
        { id: 1, signingInfo: { signedByProducer: true } },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when security code is wrong", async () => {
    expect.assertions(1);
    try {
      getNextPossibleStatusMock.mockResolvedValue(["SENT"]);
      prisma.form.mockResolvedValue({ id: 1, emitterCompanySiret: "a siret" });

      await signedByTransporter(
        null,
        {
          id: 1,
          signingInfo: { signedByProducer: true, signedByTransporter: true }
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when signingInfo are complete and correct", async () => {
    getNextPossibleStatusMock.mockResolvedValue(["SENT"]);
    prisma.form.mockResolvedValue({ id: 1, emitterCompanySiret: "a siret" });
    prisma.$exists.company.mockResolvedValue(true);

    await signedByTransporter(
      null,
      {
        id: 1,
        signingInfo: { signedByProducer: true, signedByTransporter: true }
      },
      defaultContext
    );
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
  });
});
