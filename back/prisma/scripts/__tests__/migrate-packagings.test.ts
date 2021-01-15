import { MigratePackagingsUpdater } from "../migrate-packagings";

const formsMock = jest.fn();
const updateFormMock = jest.fn();

jest.mock("../../../src/prisma", () => ({
  form: {
    findMany: jest.fn((...args) => formsMock(...args)),
    update: jest.fn((...args) => updateFormMock(...args))
  }
}));

describe("migrate packagings updater", () => {
  beforeEach(() => {
    formsMock.mockReset();
    updateFormMock.mockReset();
  });

  it("update all forms without `packagingInfos`", async () => {
    // 1 form with packagingInfos, 2 without
    const forms = [{ wasteDetailsPackagingInfos: [] }, {}, {}];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledTimes(2);
  });

  it("assign empty `packagingInfos` when there is no packaging on form", async () => {
    const forms = [{}];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: { wasteDetailsPackagingInfos: [] }
      })
    );
  });

  it("assign `packagingInfos` corresponding to existing packagings ", async () => {
    const forms = [
      {
        wasteDetailsPackagings: ["FUT", "CITERNE", "AUTRE"],
        wasteDetailsOtherPackaging: "Un autre",
        wasteDetailsNumberOfPackages: 3
      }
    ];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: {
          wasteDetailsPackagingInfos: [
            {
              type: "FUT",
              other: null,
              quantity: 1
            },
            {
              type: "CITERNE",
              other: null,
              quantity: 1
            },
            {
              type: "AUTRE",
              other: "Un autre",
              quantity: 1
            }
          ]
        }
      })
    );
  });

  it("assign `packagingInfos` quantity evenly accross packagings\
  when there is more packages than packagings", async () => {
    const forms = [
      {
        wasteDetailsPackagings: ["FUT", "CITERNE"],
        wasteDetailsNumberOfPackages: 5
      }
    ];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: {
          wasteDetailsPackagingInfos: [
            {
              type: "FUT",
              other: null,
              quantity: 3
            },
            {
              type: "CITERNE",
              other: null,
              quantity: 2
            }
          ]
        }
      })
    );
  });

  it("assign `packagingInfos` quantity evenly accross packagings\
  when there is less packages than packagings", async () => {
    const forms = [
      {
        wasteDetailsPackagings: ["FUT", "CITERNE", "GRV"],
        wasteDetailsNumberOfPackages: 1
      }
    ];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: {
          wasteDetailsPackagingInfos: [
            {
              type: "FUT",
              other: null,
              quantity: 1
            },
            {
              type: "CITERNE",
              other: null,
              quantity: 0
            },
            {
              type: "GRV",
              other: null,
              quantity: 0
            }
          ]
        }
      })
    );
  });

  it("assign `packagingInfos` quantity to 0\
  when quantity is corrupted", async () => {
    const forms = [
      {
        wasteDetailsPackagings: ["FUT", "CITERNE", "GRV"],
        wasteDetailsNumberOfPackages: -5
      }
    ];
    formsMock.mockResolvedValue(forms);

    const updater = new MigratePackagingsUpdater();
    await updater.run();

    expect(updateFormMock).toHaveBeenCalledWith(
      jasmine.objectContaining({
        data: {
          wasteDetailsPackagingInfos: [
            {
              type: "FUT",
              other: null,
              quantity: 0
            },
            {
              type: "CITERNE",
              other: null,
              quantity: 0
            },
            {
              type: "GRV",
              other: null,
              quantity: 0
            }
          ]
        }
      })
    );
  });
});
