export const emptyValues = obj => {
  if (typeof obj === "object") {
    // iterating over the object using for..in
    for (const keys in obj) {
      // Date
      if (obj[keys] instanceof Date) {
        obj[keys] = "";
      } else if (Array.isArray(obj[keys])) {
        obj[keys] = obj[keys].map(o => emptyValues(o));
      }
      //checking if the current value is an object itself
      else if (typeof obj[keys] === "object") {
        // if so then again calling the same function
        emptyValues(obj[keys]);
      } else {
        // else replacing the value
        obj[keys] = "";
      }
    }
    return obj;
  }
  return "";
};
