import { Option } from "../Select/Select";

/**
 * Builds the label of the select (that is, a string with the labels of the corresponding
 * selected value) based on the original options map, and the actually selected values.
 *
 * Something like "Option 1 (Option 1.1, Option 1.2), Option 2"
 *
 * Because there can be any number of nested options, this is a recursive method.
 *
 * @options the original array of possible options (including nested)
 * @selectedOptions the actually selected options (array of values, flat)
 * @parentValue (in recursive iterations) the value of parent option
 */
export const getLabel = (
  options: Option[],
  selectedOptions: string[],
  parentValue: string | null = null
) => {
  // Nothing has been selected yet
  if (!selectedOptions.length) {
    return "Sélectionner une option";
  }

  const optionsLabels = options.map(option => {
    let optionPath = option.value;
    if (parentValue) optionPath = `${parentValue}.${option.value}`;

    const optionIsSelected = selectedOptions.some(
      selectedOption => selectedOption === optionPath
    );

    if (optionIsSelected) {
      // Option has sub-options
      if (option.options) {
        // Recursive call to get potential sub-options labels (if selected)
        const subOptionsLabels = getLabel(
          option.options,
          selectedOptions,
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
  });

  return optionsLabels.filter(Boolean).join(", ");
};

/**
 * Called when user selects / deselects a checkbox in the select.
 *
 * A bit tricky because of infinite nested options. Uses recursive functions.
 *
 * @param option the option that was clicked on
 * @param parentPaths an array of all the values of parent options, like ["OPTION1", "OPTION1.1", ...]
 * @param optionPath the path of the option, like OPTION1.OPTION1.1.OPTION1.1.1
 * @param selectedOptions the values of currently selected options, like ["OPTION1", "OPTION2", ...]
 * @param setSelectedOptions the method to change the state with newly selected options
 */
type SetOptionsFn = (options: string[]) => string[];
export const onSelectChange = (
  option: Option,
  parentPaths: string[],
  optionPath: string,
  selectedOptions: string[],
  setSelectedOptions: (SetOptionsFn) => void
) => {
  const optionIsAlreadySelected = selectedOptions.some(o => o === optionPath);

  // Deselect. If we de-select an option, we must de-select all its children
  if (optionIsAlreadySelected) {
    setSelectedOptions((selectedOptions: string[]) => {
      // Remove option
      let newSelectedOptions = [
        ...selectedOptions.filter(o => o !== optionPath)
      ];

      // Recursive function to de-select all sub-options from option
      const removeOptionsFromArray = (
        options,
        parent: string | null = null
      ) => {
        options.forEach(option => {
          newSelectedOptions = [
            ...newSelectedOptions.filter(o => o !== `${parent}.${option.value}`)
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

      return newSelectedOptions.filter(Boolean);
    });
  }
  // Select. If we select an option, we must select its parents
  else {
    // This code transforms the flat hierarchy array into all parent options paths:
    // ie: ["OPTION1", "OPTION1.1", "OPTION1.1.1"] becomes:
    // ["OPTION1", "OPTION1.OPTION1.1", "OPTION1.OPTION1.1.1"]
    const parentPathsCombinations: string[] = [];
    let path = "";
    parentPaths.forEach(parentPath => {
      if (path.length) path += `.${parentPath}`;
      else path += parentPath;
      parentPathsCombinations.push(path);
    });

    // Now that we have all possible parent options' paths, select them
    setSelectedOptions((selectedOptions: string[]) =>
      Array.from(
        new Set([
          ...selectedOptions, // Already selected options
          optionPath, // Targeted option
          ...parentPathsCombinations // Parents from targeted option
        ])
      ).filter(Boolean)
    );
  }
};
