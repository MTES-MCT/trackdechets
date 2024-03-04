import { extractPostalCodeFromAddress } from "../utils";

describe("extractPostalCodeFromAddress", () => {
  test.each`
    input                                     | expected
    ${""}                                     | ${undefined}
    ${"4 boulevard pasteur 44100 NANTES"}     | ${"44100"}
    ${"4 boulevard pasteur 44-100 NANTES"}    | ${undefined}
    ${"4 boulevard pasteur 44 100 NANTES"}    | ${undefined}
    ${"4 boulevard pasteur 44test100 NANTES"} | ${undefined}
    ${"4 boulevard pasteur NANTES"}           | ${undefined}
    ${"44100 NANTES"}                         | ${"44100"}
    ${"43561 boulevard pasteur 44100 NANTES"} | ${"44100"}
    ${"4 boulevard pasteur 441001 NANTES"}    | ${undefined}
    ${"4 boulevard pasteur 4B100 NANTES"}     | ${undefined}
  `(
    'simple & edge-cases > "$input" should return $expected',
    ({ input, expected }) => {
      expect(extractPostalCodeFromAddress(input)).toEqual(expected);
    }
  );

  test.each`
    input                                | expected
    ${"0 rue quelque chose 01400 VILLE"} | ${"01400"}
    ${"0 rue quelque chose 01800 VILLE"} | ${"01800"}
    ${"0 rue quelque chose 09200 VILLE"} | ${"09200"}
    ${"0 rue quelque chose 10200 VILLE"} | ${"10200"}
    ${"0 rue quelque chose 22980 VILLE"} | ${"22980"}
    ${"0 rue quelque chose 37190 VILLE"} | ${"37190"}
    ${"0 rue quelque chose 55130 VILLE"} | ${"55130"}
    ${"0 rue quelque chose 62450 VILLE"} | ${"62450"}
    ${"0 rue quelque chose 76110 VILLE"} | ${"76110"}
    ${"0 rue quelque chose 88400 VILLE"} | ${"88400"}
    ${"0 rue quelque chose 98000 VILLE"} | ${"98000"}
  `(
    'running through FR post codes > "$input" should return $expected',
    ({ input, expected }) => {
      expect(extractPostalCodeFromAddress(input)).toEqual(expected);
    }
  );
});
