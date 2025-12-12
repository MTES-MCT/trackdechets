/**
 * Construct the form state by merging initialState and the actual form.
 * The actual form may include properties that do not belong to the form.
 * If we keep them in the form state they will break the mutation validation.
 * To avoid that, we make sure that every properties we keep is a property contained in initial state.
 *
 * @param initialState what an empty Form is
 * @param actualForm the actual form
 * @param onPaths array of objects containing paths to watch and corresponding callbacks to allow external computation of the default value
 * @param currentPath is used for recursion to track the current path
 * 
 */

export function getComputedState(
  initialState: any,
  actualForm: any,
  onPaths: Array<{ path: string; getComputedValue: (initialValue: any, actualValue: any) => any }> = [],
  fullPath = ""
) {
  if (!actualForm) {
    return initialState;
  }

  const startingObject = actualForm.id ? { id: actualForm.id } : {};

    
  return Object.keys(initialState).reduce((prev, curKey) => {
    const initialValue = initialState[curKey];  
    const currentPath = fullPath.concat(`${fullPath.length > 0 ? "." : ""}${curKey}`);

    console.log(currentPath);

    if (
      typeof initialValue === "object" &&
      initialValue !== null &&
      !(initialValue instanceof Array)
    ) {
      prev[curKey] = getComputedState(
        initialValue,
        actualForm[curKey],
        onPaths,
        currentPath
      );
    } else {
      // Keep null values - only replace undefined.
      let value = actualForm[curKey] === undefined ? initialValue : actualForm[curKey];
      
      // Keep null values - only replace undefined.
      if (onPaths.length > 0) {
        onPaths.forEach(callback => {
          if (
            callback.path === currentPath
          ) {
            value = callback.getComputedValue(initialValue, actualForm[curKey]);
          }
        });
      }
      
      prev[curKey] = value;
    }

    return prev;
  }, startingObject);
}
