import { formsReader } from "../streams";
import { formFactory, userFactory } from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";

describe("formsReader", () => {
  afterEach(() => resetDatabase());

  it("should read forms in chunks", async () => {
    const user = await userFactory();

    // create 10 forms
    for (let i = 0; i < 10; i++) {
      await formFactory({ ownerId: user.id });
    }

    // read forms by chunk of 2
    const reader = formsReader({ chunk: 2 });

    const forms = [];

    reader.on("data", chunk => {
      forms.push(chunk);
    });

    // wait until all chunks are consumed
    await new Promise<void>(resolve => {
      reader.on("end", () => resolve());
    });

    expect(forms).toHaveLength(10);
  });
});
