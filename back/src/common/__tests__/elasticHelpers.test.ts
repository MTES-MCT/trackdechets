import { addDays } from "date-fns";
import {
  getNonPendingLatestRevisionRequestUpdatedAt,
  RevisionRequest
} from "../elasticHelpers";
import { sameDayMidnight } from "../../utils";

describe("elasticHelpers", () => {
  describe("getNonPendingLatestRevisionRequestUpdatedAt", () => {
    it.each([
      [undefined, undefined],
      [null, undefined],
      [[], undefined],
      [[{ status: "PENDING", updatedAt: new Date() }], undefined],
      [
        [
          { status: "ACCEPTED", updatedAt: new Date() },
          { status: "PENDING", updatedAt: new Date() }
        ],
        undefined
      ],
      [
        [{ status: "REFUSED", updatedAt: addDays(new Date(), -1) }],
        addDays(new Date(), -1).getTime()
      ],
      [
        [
          { status: "REFUSED", updatedAt: addDays(new Date(), -10) },
          {
            status: "REFUSED",
            updatedAt: sameDayMidnight(addDays(new Date(), -2))
          },
          { status: "ACCEPTED", updatedAt: addDays(new Date(), -25) }
        ],
        sameDayMidnight(addDays(new Date(), -2)).getTime()
      ]
    ])("%p should return %p", (input, output) => {
      // When
      const latestUpdatedAt = getNonPendingLatestRevisionRequestUpdatedAt(
        input as RevisionRequest[]
      );

      // Then
      expect(latestUpdatedAt).toBe(output);
    });
  });
});
