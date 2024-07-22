import { getLabel, onSelectChange } from "./SelectWithSubOptions.utils";
import { Option } from "../Select/Select";

const OPTIONS: Option[] = [
  {
    value: "OPTION1",
    label: "Option 1",
    options: [
      {
        value: "OPTION1.1",
        label: "Option 1.1"
      },
      {
        value: "OPTION1.2",
        label: "Option 1.2"
      }
    ]
  },
  {
    value: "OPTION2",
    label: "Option 2"
  },
  {
    value: "OPTION3",
    label: "Option 3",
    options: [
      {
        value: "OPTION3.1",
        label: "Option 3.1"
      },
      {
        value: "OPTION3.2",
        label: "Option 3.2",
        options: [
          {
            value: "OPTION3.2.1",
            label: "Option 3.2.1"
          },
          {
            value: "OPTION3.2.2",
            label: "Option 3.2.2"
          }
        ]
      }
    ]
  }
];

describe("getLabel", () => {
  it("should return top-level options labels, separated by comma", () => {
    // When
    const label = getLabel(OPTIONS, ["OPTION1", "OPTION2"]);

    // Then
    expect(label).toBe("Option 1, Option 2");
  });

  it("should return default string if no selected option", () => {
    // When
    const label = getLabel(OPTIONS, []);

    // Then
    expect(label).toBe("Sélectionner une option");
  });

  it("should return all labels including nested ones, separated by comma", () => {
    // When
    const label = getLabel(OPTIONS, [
      "OPTION1",
      "OPTION1.OPTION1.1",
      "OPTION2",
      "OPTION3",
      "OPTION3.OPTION3.2",
      "OPTION3.OPTION3.2.OPTION3.2.1"
    ]);

    // Then
    expect(label).toBe(
      "Option 1 (Option 1.1), Option 2, Option 3 (Option 3.2 (Option 3.2.1))"
    );
  });
});

describe("onSelectChange", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should update selected options, adding latest selected value", () => {
    // Given
    let selectedOptions = [];
    const setSelectedOptionsMock = newSelectedOptionsFn => {
      selectedOptions = newSelectedOptionsFn(selectedOptions);
    };

    // When
    onSelectChange(
      OPTIONS[0],
      [],
      OPTIONS[0].value,
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toStrictEqual(["OPTION1"]);
  });

  it("Should update selected options, removing latest selected value", () => {
    // Given
    let selectedOptions = ["OPTION1"];
    const setSelectedOptionsMock = newSelectedOptionsFn => {
      selectedOptions = newSelectedOptionsFn(selectedOptions);
    };

    // When
    onSelectChange(
      OPTIONS[0],
      [],
      OPTIONS[0].value,
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toStrictEqual([]);
  });

  it("If selecting nested value, should also select all parents", () => {
    // Given
    let selectedOptions = [];
    const setSelectedOptionsMock = newSelectedOptionsFn => {
      selectedOptions = newSelectedOptionsFn(selectedOptions);
    };

    // When
    onSelectChange(
      OPTIONS[2].options?.[1].options?.[0]!,
      ["OPTION3", "OPTION3.2"],
      "OPTION3.OPTION3.2.OPTION3.2.1",
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toEqual([
      "OPTION3.OPTION3.2.OPTION3.2.1",
      "OPTION3",
      "OPTION3.OPTION3.2"
    ]);
  });

  it("If de-selecting parent value, should also de-select all children", () => {
    // Given
    let selectedOptions = [
      "OPTION3.OPTION3.2.OPTION3.2.1",
      "OPTION3",
      "OPTION3.OPTION3.2"
    ];
    const setSelectedOptionsMock = newSelectedOptionsFn => {
      selectedOptions = newSelectedOptionsFn(selectedOptions);
    };

    // When
    onSelectChange(
      OPTIONS[2],
      [],
      "OPTION3",
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toEqual([]);
  });
});
