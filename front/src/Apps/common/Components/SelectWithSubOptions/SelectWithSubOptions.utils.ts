import { Option } from "../Select/Select";

/**
 * Builds the label of the select (that is, a string with the labels of the corresponding
 * selected values) based on the original options map, and the actually selected values.
 *
 * Something like "Option 1 (Option 1.1, Option 1.2), Option 2"
 *
 * Because there can be any number of nested options, this is a recursive method.
 *
 * @allOptions the original array of possible options (including nested)
 * @selectedOptionsValues the actually selected options values (array of values, flat)
 * @parentValue (in recursive iterations) the value of parent option
 */
export const getLabel = (
  allOptions: Option[],
  selectedOptionsValues: string[],
  parentValue: string | null = null
) => {
  // Nothing has been selected yet
  if (!selectedOptionsValues.length) {
    return "Sélectionner une option";
  }

  const optionsLabels = allOptions.map(option => {
    let optionPath = option.value;
    if (parentValue) optionPath = `${parentValue}.${option.value}`;

    const optionIsSelected = selectedOptionsValues.some(
      selectedOption => selectedOption === optionPath
    );

    if (optionIsSelected) {
      // Option has sub-options
      if (option.options) {
        // Recursive call to get potential sub-options labels (if selected)
        const subOptionsLabels = getLabel(
          option.options,
          selectedOptionsValues,
          optionPath
        );

        // Some sub-options are indeed selected
        if (Boolean(subOptionsLabels)) {
          return `${option.label} (${subOptionsLabels})`;
        }

        return `${option.label}`;
      } else {
        return option.label;
      }
    }

    return null;
  });

  return optionsLabels.filter(Boolean).join(", ");
};

/**
 * Called when user selects / deselects a checkbox in the select.
 *
 * A bit tricky because of infinite nested options. Uses recursive functions.
 *
 * @param option the option that was clicked on
 * @param allOptions all possible options in the select list
 * @param parentPaths an array of all the values of parent options, like ["OPTION1", "OPTION1.1", ...]
 * @param optionPath the path of the option, like OPTION1.OPTION1.1.OPTION1.1.1
 * @param selected the already selected options
 * @param onChange the method to call the newly selected options with
 */
export const onSelectChange = (
  option: Option,
  allOptions: Option[],
  parentPaths: string[],
  optionPath: string,
  selected: Option[],
  onChange: (e: any) => void
) => {
  const optionsValues = getValuesFromOptions(selected);

  const optionIsAlreadySelected = optionsValues.some(
    optionValue => optionValue === optionPath
  );

  // Deselect. If we de-select an option, we must de-select all its children
  if (optionIsAlreadySelected) {
    // Remove option
    let newSelectedOptionValues = [
      ...optionsValues.filter(o => o !== optionPath)
    ];

    // Recursive function to de-select all sub-options from option
    const removeOptionsFromArray = (options, parent: string | null = null) => {
      options.forEach(option => {
        newSelectedOptionValues = [
          ...newSelectedOptionValues.filter(
            o => o !== `${parent}.${option.value}`
          )
        ];

        if (option.options) {
          removeOptionsFromArray(option.options, `${parent}.${option.value}`);
        }
      });
    };

    // Option has sub-options. Remove them as well
    if (option.options) {
      removeOptionsFromArray(option.options, optionPath);
    }

    const newSelectedOptions = getOptionsFromValues(
      newSelectedOptionValues.filter(Boolean),
      allOptions
    );

    onChange(newSelectedOptions);
  }
  // Select. If we select an option, we must select its parents
  else {
    // This code transforms the flat hierarchy array into all parent options paths:
    // ie: ["OPTION1", "OPTION1.1", "OPTION1.1.1"] becomes:
    // ["OPTION1", "OPTION1.OPTION1.1", "OPTION1.OPTION1.1.OPTION1.1.1"]
    const parentPathsCombinations: string[] = [];
    let path = "";
    parentPaths.forEach(parentPath => {
      if (path.length) path += `.${parentPath}`;
      else path += parentPath;
      parentPathsCombinations.push(path);
    });

    // Now that we have all possible parent options' paths, select them
    const newValues = Array.from(
      new Set([
        ...optionsValues, // Already selected options
        optionPath, // Targeted option
        ...parentPathsCombinations // Parents from targeted option
      ])
    ).filter(Boolean);

    const newOptions = getOptionsFromValues(newValues, allOptions);

    onChange(newOptions);
  }
};

/**
 * Transforms an array of values into an array of their corresponding options.
 *
 * ex: ['OPTION1', 'OPTION2', 'OPTION2.OPTION1'] becomes
 * [{ value: "OPTION1", label: "Option 1"}, {value: "OPTION2", label: etc. }]
 *
 * @param optionsValues the options values
 * @param allOptions all possible options in the select list
 */
export const getOptionsFromValues = (
  optionsValues: string[],
  allOptions: Option[],
  parentPaths: string[] = []
): Option[] => {
  const res: Option[] = [];

  allOptions.forEach(option => {
    const optionPath = parentPaths.length
      ? [...parentPaths, option.value].join(".")
      : option.value;

    if (optionsValues.includes(optionPath)) {
      // Option has sub-options
      if (option.options) {
        const subRes = getOptionsFromValues(optionsValues, option.options, [
          ...parentPaths,
          option.value
        ]);
        const op = { ...option };

        if (subRes?.length) {
          op.options = subRes;
        } else {
          delete op.options;
        }

        res.push(op);
      } else {
        res.push(option);
      }
    }
  });

  return res;
};

/**
 * From a given array of options, will return its values, using nested path
 *
 * ie: ["OPTION1", "OPTION2.OPTION2.1", "OPTION3"]
 *
 * @param options the options to extract the values from
 */
export const getValuesFromOptions = (
  options: Option[] = [],
  parentPaths: string[] = []
): string[] => {
  let res: string[] = [];

  options.forEach(option => {
    const optionPath = parentPaths.length
      ? [...parentPaths, option.value].join(".")
      : option.value;

    res.push(optionPath);

    // Option has sub-options. Go recursive
    if (option.options) {
      const subOptionsValues = getValuesFromOptions(option.options, [
        ...parentPaths,
        option.value
      ]);

      res = [...res, ...subOptionsValues];
    }
  });

  return res;
};
