import { getUid, sameDayMidnight, daysBetween } from "../utils";

test("getUid returns a unique identifier of fixed length", () => {
  const uid = getUid(10);
  expect(uid).toHaveLength(10);
});

test("sameDayMidnight convert a date to same day at midnight", () => {
  const date = new Date("2019-10-04T20:43:00");
  const midnight = sameDayMidnight(date);
  const expected = new Date("2019-10-04T00:00:00");
  expect(midnight).toEqual(expected);
});

test("daysBetween should calculate the number of days between two dates", () => {
  const date1 = new Date("2019-10-04T20:43:00");
  const date2 = new Date("2019-10-01T09:00:00");
  const days = daysBetween(date1, date2);
  expect(days).toEqual(3);
});
