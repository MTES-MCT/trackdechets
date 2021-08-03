import makeClient from "../../../../__tests__/testClient";
import { OPERATION_CODES } from "../../../constants";

const GET_ENUM = `
  query GetEnum($name: String!) {
    __type(name: $name) {
      enumValues {
        name
      }
    }
  }
`;
interface GetEnumQuery {
  __type: { enumValues: Array<{ name: string }> };
}

describe("Bsff enums", () => {
  it.each([["BsffOperationCode", Object.keys(OPERATION_CODES)]])(
    "should list all %s values",
    async (name, keys) => {
      const { query } = makeClient();
      const { data } = await query<GetEnumQuery>(GET_ENUM, {
        variables: {
          name
        }
      });

      expect(data.__type.enumValues.map(({ name }) => name).sort()).toEqual(
        keys.sort()
      );
    }
  );
});
