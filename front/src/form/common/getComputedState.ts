/**
 * Construct the form state by merging initialState and the actual form.
 * The actual form may include properties that do not belong to the form.
 * If we keep them in the form state they will break the mutation validation.
 * To avoid that, we make sure that every properties we keep is a property contained in initial state.
 *
 * @param initialState what an empty Form is
 * @param actualForm the actual form
 */

export function getComputedState(initialState, actualForm) {
  if (!actualForm) {
    return initialState;
  }

  const startingObject = actualForm.id ? { id: actualForm.id } : {};

  return Object.keys(initialState).reduce((prev, curKey) => {
    const initialValue = initialState[curKey];
    if (
      typeof initialValue === "object" &&
      initialValue !== null &&
      !(initialValue instanceof Array)
    ) {
      prev[curKey] = getComputedState(initialValue, actualForm[curKey]);
    } else {
      // Keep null values - only replace undefined.
      prev[curKey] =
        actualForm[curKey] === undefined ? initialValue : actualForm[curKey];
    }

    return prev;
  }, startingObject);
}
