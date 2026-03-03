import {
  getBsdSuiteReadableIdFromFormInput,
  renameExistingBsdSuiteReadableId
} from "../bsdSuiteCreation";

describe("bsdSuiteCreation", () => {
  describe("getBsdSuiteReadableIdFromFormInput", () => {
    it("returns suite readableId when forwardedIn.create has readableId ending with -suite", () => {
      const data = {
        readableId: "BSD-20250101-XXX",
        forwardedIn: {
          create: { readableId: "BSD-20250101-XXX-suite", owner: {} }
        }
      } as any;
      expect(getBsdSuiteReadableIdFromFormInput(data)).toBe(
        "BSD-20250101-XXX-suite"
      );
    });

    it("returns null when no forwardedIn", () => {
      expect(getBsdSuiteReadableIdFromFormInput({} as any)).toBe(null);
      expect(
        getBsdSuiteReadableIdFromFormInput({
          readableId: "X",
          forwardedIn: undefined
        } as any)
      ).toBe(null);
    });

    it("returns null when forwardedIn.create readableId does not end with -suite", () => {
      const data = {
        forwardedIn: {
          create: { readableId: "BSD-20250101-XXX" }
        }
      } as any;
      expect(getBsdSuiteReadableIdFromFormInput(data)).toBe(null);
    });

    it("returns null when forwardedIn is update or disconnect (update input)", () => {
      expect(
        getBsdSuiteReadableIdFromFormInput({
          forwardedIn: { update: {} }
        } as any)
      ).toBe(null);
      expect(
        getBsdSuiteReadableIdFromFormInput({
          forwardedIn: { disconnect: true }
        } as any)
      ).toBe(null);
    });
  });

  describe("renameExistingBsdSuiteReadableId", () => {
    it("renames soft-deleted form with given readableId when found", async () => {
      const mockPrisma = {
        form: {
          findFirst: jest.fn().mockResolvedValue({ id: "id-1" }),
          update: jest.fn().mockResolvedValue(undefined)
        }
      };
      await renameExistingBsdSuiteReadableId(
        mockPrisma as any,
        "BSD-20250101-XXX-suite"
      );
      expect(mockPrisma.form.findFirst).toHaveBeenCalledWith({
        where: {
          readableId: "BSD-20250101-XXX-suite",
          isDeleted: true
        },
        select: { id: true }
      });
      expect(mockPrisma.form.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.form.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "id-1" },
          data: expect.objectContaining({
            readableId: expect.stringMatching(/^BSD-20250101-XXX-suite-.{10,}$/)
          })
        })
      );
    });

    it("does not call update when no soft-deleted form with that readableId exists", async () => {
      const mockPrisma = {
        form: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn()
        }
      };
      await renameExistingBsdSuiteReadableId(
        mockPrisma as any,
        "BSD-20250101-XXX-suite"
      );
      expect(mockPrisma.form.findFirst).toHaveBeenCalledWith({
        where: {
          readableId: "BSD-20250101-XXX-suite",
          isDeleted: true
        },
        select: { id: true }
      });
      expect(mockPrisma.form.update).not.toHaveBeenCalled();
    });
  });
});
