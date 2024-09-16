import {
  getLabel,
  getOptionsFromValues,
  getValuesFromOptions,
  onSelectChange
} from "./SelectWithSubOptions.utils";
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
  it("Should update selected options, adding latest selected value", () => {
    // Given
    let selectedOptions = [];
    const onChangeMock = newSelectedOptions => {
      selectedOptions = newSelectedOptions;
    };

    // When
    onSelectChange(
      {
        value: "OPTION1",
        label: "Option 1"
      },
      OPTIONS,
      [],
      OPTIONS[0].value,
      selectedOptions,
      onChangeMock
    );

    // Then
    expect(selectedOptions).toStrictEqual([
      {
        value: "OPTION1",
        label: "Option 1"
      }
    ]);
  });

  it("Should update selected options, removing latest selected value", () => {
    // Given
    let selectedOptions = [
      {
        value: "OPTION1",
        label: "Option 1"
      }
    ];
    const setSelectedOptionsMock = newSelectedOptions => {
      selectedOptions = newSelectedOptions;
    };

    // When
    onSelectChange(
      {
        value: "OPTION1",
        label: "Option 1"
      },
      OPTIONS,
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
    const setSelectedOptionsMock = newSelectedOptions => {
      selectedOptions = newSelectedOptions;
    };

    // When
    onSelectChange(
      {
        value: "OPTION3.2.1",
        label: "Option 3.2.1"
      },
      OPTIONS,
      ["OPTION3", "OPTION3.2"],
      "OPTION3.OPTION3.2.OPTION3.2.1",
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toEqual([
      {
        value: "OPTION3",
        label: "Option 3",
        options: [
          {
            value: "OPTION3.2",
            label: "Option 3.2",
            options: [
              {
                value: "OPTION3.2.1",
                label: "Option 3.2.1"
              }
            ]
          }
        ]
      }
    ]);
  });

  it("If de-selecting parent value, should also de-select all children", () => {
    // Given
    let selectedOptions = [
      {
        value: "OPTION3",
        label: "Option 3",
        options: [
          {
            value: "OPTION3.2",
            label: "Option 3.2",
            options: [
              {
                value: "OPTION3.2.1",
                label: "Option 3.2.1"
              }
            ]
          }
        ]
      }
    ];
    const setSelectedOptionsMock = newSelectedOptions => {
      selectedOptions = newSelectedOptions;
    };

    // When
    onSelectChange(
      {
        value: "OPTION3",
        label: "Option 3"
      },
      OPTIONS,
      [],
      "OPTION3",
      selectedOptions,
      setSelectedOptionsMock
    );

    // Then
    expect(selectedOptions).toEqual([]);
  });
});

describe("getOptionsFromValues", () => {
  it("should return original options from values", () => {
    // Given
    const res = getOptionsFromValues(["OPTION1", "OPTION2"], OPTIONS);

    // Then
    expect(res).toStrictEqual([
      {
        value: "OPTION1",
        label: "Option 1"
      },
      {
        value: "OPTION2",
        label: "Option 2"
      }
    ]);
  });

  it("should return original options including nested ones, from values", () => {
    // Given
    const res = getOptionsFromValues(
      [
        "OPTION1",
        "OPTION3",
        "OPTION3.OPTION3.2",
        "OPTION3.OPTION3.2.OPTION3.2.1"
      ],
      OPTIONS
    );

    // Then
    expect(res).toStrictEqual([
      {
        value: "OPTION1",
        label: "Option 1"
      },
      {
        value: "OPTION3",
        label: "Option 3",
        options: [
          {
            value: "OPTION3.2",
            label: "Option 3.2",
            options: [
              {
                value: "OPTION3.2.1",
                label: "Option 3.2.1"
              }
            ]
          }
        ]
      }
    ]);
  });

  it("should return empty array of no values", () => {
    // Given
    const res = getOptionsFromValues([], OPTIONS);

    // Then
    expect(res).toStrictEqual([]);
  });
});

describe("getValuesFromOptions", () => {
  it("should return the values from the options", () => {
    // When
    const options = [
      {
        value: "OPTION1",
        label: "Option 1"
      },
      {
        value: "OPTION3",
        label: "Option 3"
      }
    ];

    // Given
    const res = getValuesFromOptions(options);

    // Then
    expect(res).toStrictEqual(["OPTION1", "OPTION3"]);
  });

  it("should return the values including nested, from the options", () => {
    // When
    const options = [
      {
        value: "OPTION1",
        label: "Option 1"
      },
      {
        value: "OPTION3",
        label: "Option 3",
        options: [
          {
            value: "OPTION3.1",
            label: "Option 3.1",
            options: [
              {
                value: "OPTION3.1.1",
                label: "Option 3.1.1"
              }
            ]
          }
        ]
      }
    ];

    // Given
    const res = getValuesFromOptions(options);

    // Then
    expect(res).toStrictEqual([
      "OPTION1",
      "OPTION3",
      "OPTION3.OPTION3.1",
      "OPTION3.OPTION3.1.OPTION3.1.1"
    ]);
  });

  it("should return empty array if no values", () => {
    // When
    const options = [];

    // Given
    const res = getValuesFromOptions(options);

    // Then
    expect(res).toStrictEqual([]);
  });
});
