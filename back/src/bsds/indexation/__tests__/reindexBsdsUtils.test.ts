import { splitIntoBsdIds } from "../reindexBsdsUtils";

describe("reindexBsdsUtils", () => {
  describe("splitIntoBsdIds", () => {
    test.each`
      input                                                                        | expected
      ${"BSDA-20221109-9B4SV145H"}                                                 | ${["BSDA-20221109-9B4SV145H"]}
      ${"FF-20231128-KFAYQC3M0"}                                                   | ${["FF-20231128-KFAYQC3M0"]}
      ${"TD-20-TCG03421"}                                                          | ${["TD-20-TCG03421"]}
      ${"TD-19-TCG03421"}                                                          | ${["TD-19-TCG03421"]}
      ${"TD-21-AAA00792"}                                                          | ${["TD-21-AAA00792"]}
      ${"td21aaa00792"}                                                            | ${["TD-21-AAA00792"]}
      ${""}                                                                        | ${[]}
      ${"    "}                                                                    | ${[]}
      ${"FF-20231128-KFAYQC3M0-suite"}                                             | ${["FF-20231128-KFAYQC3M0-suite"]}
      ${"VHU-20220128-1HXF2PPPR"}                                                  | ${["VHU-20220128-1HXF2PPPR"]}
      ${"PAOH-20220128-1HXF2PPPR"}                                                 | ${["PAOH-20220128-1HXF2PPPR"]}
      ${"DASRI-20220128-1HXF2PPPR"}                                                | ${["DASRI-20220128-1HXF2PPPR"]}
      ${"BSD-20230316-FPF4Z6QPY"}                                                  | ${["BSD-20230316-FPF4Z6QPY"]}
      ${"BSD-20230316-FPF4Z6QPY-suite"}                                            | ${["BSD-20230316-FPF4Z6QPY-suite"]}
      ${"BSD-20230316-FPF4Z6QPYsuite"}                                             | ${["BSD-20230316-FPF4Z6QPY-suite"]}
      ${"BSD-20230316-FPF4Z6QPYsUIte"}                                             | ${["BSD-20230316-FPF4Z6QPY-suite"]}
      ${"BSD-20230316-FPF4Z6QPY-SUITE"}                                            | ${["BSD-20230316-FPF4Z6QPY-suite"]}
      ${"DASRI-20211220-XXS4SKCZ6"}                                                | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'DASRI-20211220-XXS4SKCZ6'"}                                              | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'DASRI20211220XXS4SKCZ6'"}                                                | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'dasri20211220xxs4skcz6'"}                                                | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'dasri20211220-xxs4skcz6'"}                                               | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'daSRi20211220-xXS4skCz6'"}                                               | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'dasri-20211220-xxs4skcz6'"}                                              | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"'dasRI20211220-Xxs4Skcz6'"}                                               | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${'"dasRI20211220-Xxs4Skcz6"'}                                               | ${["DASRI-20211220-XXS4SKCZ6"]}
      ${"BSDA-20221109-9B4SV145H FF-20231128-KFAYQC3M0"}                           | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0"]}
      ${"BSDA-20221109-9B4SV145H,FF-20231128-KFAYQC3M0"}                           | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0"]}
      ${"BSDA-20221109-9B4SV145H BSDA-20221109-9B4SV145H"}                         | ${["BSDA-20221109-9B4SV145H"]}
      ${"BSDA-20221109-9B4SV145H, FF-20231128-KFAYQC3M0"}                          | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0"]}
      ${"BSDA-20221109-9B4SV145H\nFF-20231128-KFAYQC3M0"}                          | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0"]}
      ${"BSDA-20221109-9B4SV145H    FF-20231128-KFAYQC3M0"}                        | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0"]}
      ${"BSDA-20221109-9B4SV145H    FF-20231128-KFAYQC3M0 VHU-20220128-1HXF2PPPR"} | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0", "VHU-20220128-1HXF2PPPR"]}
      ${"BSDA-202211099B4SV145H,    fF-20231128-kFayQC3M0 , vhu202201281HXF2pppr"} | ${["BSDA-20221109-9B4SV145H", "FF-20231128-KFAYQC3M0", "VHU-20220128-1HXF2PPPR"]}
      ${"TD-20-TCG03420,    td-21-aaa00346 , vhu202201281HXF2pppr"}                | ${["TD-20-TCG03420", "TD-21-AAA00346", "VHU-20220128-1HXF2PPPR"]}
    `('"$input" should become $expected', ({ input, expected }) => {
      expect(splitIntoBsdIds(input)).toEqual(expected);
    });

    test.each([
      "YOLO-20221109-9B4SV145H",
      "20221109-9B4SV145H",
      "cldsr4c9r05uw9w3rs9qi3xp8",
      "BSDD-20221109-9B4SV145H",
      "BSDA-X0221109-9B4SV145H",
      "BSDA-18891109-9B4SV145H",
      "BSDA-25581109-9B4SV145H",
      "BSDA-25581109-9B4SV145",
      "BSDA-20221109-9B4SV14577",
      "BSDA-20221109-9B4SV1457-souite",
      "BSDA-20221109-9B4SV1457-ste",
      "BSDA-20221109-9B4SV1457-ste",
      "TD-22-TCG03420",
      "TD-18-TCG03420",
      "TD-20-TCG034201",
      "TD-20-TCG0342",
      "TB-20-TCG03421",
      "TD-2000-TCG03421",
      "TD-2021-TCG03421"
    ])("%p should throw error", input => {
      expect.assertions(1);

      try {
        splitIntoBsdIds(input);
      } catch (e) {
        expect(e.message).toEqual(
          `"${input}" n'est pas un identifiant de bordereau valide`
        );
      }
    });
  });
});
