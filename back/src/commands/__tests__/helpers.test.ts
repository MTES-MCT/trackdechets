import { xDaysAgo } from "../onboarding.helpers";

describe("xDaysAgo", () => {
  it("should return a relative past date", () => {
    const someDate = new Date(2019, 9, 3, 10, 0, 0);
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore).toEqual(new Date("2019-09-30T00:00:00.000Z"));
  });
});
