import { getReadableId } from "../readable-id";

const formsMock = jest.fn();

jest.mock("src/prisma", () => ({
  prisma: {
    form: {
      findMany: jest.fn((...args) => formsMock(...args))
    }
  }
}));

describe("getReadableId", () => {
  afterEach(() => {
    formsMock.mockReset();
  });

  const currentYearDigits = `${new Date().getFullYear()}`.slice(2, 4);

  test("should return first ID when there is no form", async () => {
    formsMock.mockResolvedValueOnce([]);

    const result = await getReadableId();

    expect(result).toBe(`TD-${currentYearDigits}-AAA00001`);
  });

  test("should return next ID when there is existing forms on the current year", async () => {
    formsMock.mockResolvedValueOnce([
      { readableId: `TD-${currentYearDigits}-ABC12345` }
    ]);

    const result = await getReadableId();

    expect(result).toBe(`TD-${currentYearDigits}-ABC12346`);
  });

  test("should return first year number when there is no existing forms on the current year", async () => {
    formsMock.mockResolvedValueOnce([{ readableId: "TD-00-AAA99999" }]);

    const result = await getReadableId();

    expect(result).toBe(`TD-${currentYearDigits}-AAA00001`);
  });
});
