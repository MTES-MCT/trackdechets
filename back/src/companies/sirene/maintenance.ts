import { Exception } from "handlebars";

export function setInMaintenanceIf<T>(
  fn: (...args) => Promise<T>,
  condition: boolean
) {
  const canBeInMantenance = async (...args) => {
    if (condition) {
      throw new Exception("API SIRENE en maintenance");
    }
    return fn(...args);
  };
  return canBeInMantenance;
}
