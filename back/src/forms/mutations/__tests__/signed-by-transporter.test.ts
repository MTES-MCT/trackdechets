import { ErrorCode } from "../../../common/errors";
import { signedByTransporter } from "../mark-as";
import { getContext } from "../__mocks__/data";
import { TransporterSignatureFormInput } from "../../../generated/graphql/types";

const temporaryStorageDetailMock = jest.fn(() => Promise.resolve(null));
const formMock = jest.fn(() => Promise.resolve({}));
const appendix2FormsMock = jest.fn(() => Promise.resolve([]));
function mockFormWith(value) {
  const result: any = Promise.resolve(value);
  result.temporaryStorageDetail = temporaryStorageDetailMock;
  result.appendix2Forms = appendix2FormsMock;
  formMock.mockReturnValue(result);
}

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

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    form: () => prisma.form(),
    updateForm: () => prisma.updateForm(),
    createForm: () => prisma.createForm(),
    createStatusLog: () => prisma.createStatusLog(),
    updateManyForms: () => prisma.updateManyForms(),
    $exists: {
      company: () => prisma.$exists.company()
    }
  }
}));

describe("Forms -> signedByTransporter mutation", () => {
  const defaultContext = getContext();

  beforeEach(() => {
    Object.keys(prisma).forEach(
      key => prisma[key].mockClear && prisma[key].mockClear()
    );
  });

  it("should fail when if its not signed by producer", async () => {
    expect.assertions(1);
    try {
      mockFormWith({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

      await signedByTransporter(
        {
          id: "1",
          signingInfo: {
            signedByTransporter: true
          } as TransporterSignatureFormInput
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when if its not signed by transporter", async () => {
    expect.assertions(1);
    try {
      mockFormWith({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

      await signedByTransporter(
        {
          id: "1",
          signingInfo: {
            signedByProducer: true
          } as TransporterSignatureFormInput
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should fail when security code is wrong", async () => {
    expect.assertions(1);
    try {
      mockFormWith({
        id: 1,
        status: "SEALED",
        emitterCompanySiret: "a siret"
      });

      await signedByTransporter(
        {
          id: "1",
          signingInfo: {
            signedByProducer: true,
            signedByTransporter: true,
            securityCode: 1234
          } as TransporterSignatureFormInput
        },
        defaultContext
      );
    } catch (err) {
      expect(err.extensions.code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("should work when signingInfo are complete and correct", async () => {
    appendix2FormsMock.mockResolvedValue([{ id: "appendix id" }]);
    mockFormWith({
      id: 1,
      status: "SEALED",
      emitterCompanySiret: "a siret"
    });
    prisma.$exists.company.mockResolvedValue(true);

    await signedByTransporter(
      {
        id: "1",
        signingInfo: {
          signedByProducer: true,
          signedByTransporter: true
        } as TransporterSignatureFormInput
      },
      defaultContext
    );
    expect(prisma.updateForm).toHaveBeenCalledTimes(1);
    expect(prisma.updateManyForms).toHaveBeenCalled();
  });
});
