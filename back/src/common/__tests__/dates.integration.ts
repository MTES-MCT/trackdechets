import { resetDatabase } from "../../../integration-tests/helper";
import { formFactory, userFactory } from "../../__tests__/factories";
import { allowedFormats } from "../dates";
import { format, parse } from "date-fns";

describe("allowedFormats", () => {
  afterEach(resetDatabase);

  test.each(allowedFormats)("%p is allowed by prisma", async f => {
    const sentAt = parse("2019-10-04", "yyyy-MM-dd", new Date());
    const dateString = format(sentAt, f);
    const owner = await userFactory();

    const form = await formFactory({
      ownerId: owner.id,
      opt: { sentAt: dateString }
    });
    expect(form.sentAt).toEqual(sentAt);
  });
});
