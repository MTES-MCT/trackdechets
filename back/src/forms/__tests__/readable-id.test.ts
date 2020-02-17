import { getReadableId } from "../readable-id";
import { GraphQLContext } from "../../types";

describe("getReadableId", () => {
  const currentYearDigits = `${new Date().getFullYear()}`.slice(2, 4);

  test("should return first ID when there is no form", async () => {
    const context = {
      prisma: {
        forms: jest.fn(() => [])
      } as any,
      user: null,
      request: null
    } as GraphQLContext;

    const result = await getReadableId(context);

    expect(result).toBe(`TD-${currentYearDigits}-AAA00001`);
  });

  test("should return next ID when there is existing forms on the current year", async () => {
    const context = {
      prisma: {
        forms: jest.fn(() => [{ readableId: `TD-${currentYearDigits}-ABC12345` }])
      } as any,
      user: null,
      request: null
    } as GraphQLContext;

    const result = await getReadableId(context);

    expect(result).toBe(`TD-${currentYearDigits}-ABC12346`);
  });

  test("should return first year number when there is no existing forms on the current year", async () => {
    const context = {
      prisma: {
        forms: jest.fn(() => [{ readableId: "TD-00-AAA99999" }])
      } as any,
      user: null,
      request: null
    } as GraphQLContext;

    const result = await getReadableId(context);

    expect(result).toBe(`TD-${currentYearDigits}-AAA00001`);
  });
});
