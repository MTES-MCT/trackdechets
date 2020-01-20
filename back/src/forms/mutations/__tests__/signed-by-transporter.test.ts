import { ErrorCode } from "../../../common/errors";
import { signedByTransporter } from "../mark-as";
import * as companiesHelpers from "../../../companies/queries/userCompanies";

const getUserCompaniesMock = jest.fn();

jest.mock("../../../companies/queries", () => ({
  getUserCompanies: jest.fn(() => getUserCompaniesMock())
}));

describe("Forms -> signedByTransporter mutation", () => {
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

  const defaultContext = {
    prisma,
    user: { id: "userId" },
    request: null
  } as any;

  beforeEach(() => {
    Object.keys(prisma).forEach(
      key => prisma[key].mockClear && prisma[key].mockClear()
    );
    getUserCompaniesMock.mockReset();
  });

  it("should fail when if its not signed by producer", async () => {
    expect.assertions(1);
    try {
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      prisma.form.mockResolvedValue({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

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
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      prisma.form.mockResolvedValue({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

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
      getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
      prisma.form.mockResolvedValue({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

      await signedByTransporter(
        null,
        {
          id: 1,
          signingInfo: {
            signedByProducer: true,
            signedByTransporter: true,
            securityCode: ""
          }
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when signingInfo are complete and correct", async () => {
    getUserCompaniesMock.mockResolvedValue([{ siret: "a siret" } as any]);
    prisma.form
      .mockReturnValue({
        appendix2Forms: () => Promise.resolve([{ id: "appendix id" }])
      } as any)
      .mockReturnValueOnce(
        Promise.resolve({
          id: 1,
          status: "SEALED",
          emitterCompanySiret: "a siret"
        })
      );
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
    expect(prisma.updateManyForms).toHaveBeenCalled();
  });
});
