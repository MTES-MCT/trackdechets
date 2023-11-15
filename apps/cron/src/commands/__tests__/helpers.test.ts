import { xDaysAgo } from "../onboarding.helpers";

jest.mock("back");

describe("xDaysAgo", () => {
  it("should return a relative past date", () => {
    const someDate = new Date("2019-10-03T00:00:00.000Z");
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore).toEqual(new Date("2019-09-30T00:00:00.000Z"));
  });
});
