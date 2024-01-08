/**
 * Resolves a nested object key defined as string
 * Example :
 * const obj = { a: { b: "B" } }
 * resolve("a.b", obj) => "B"
 */
export function resolve(path, obj, separator = ".") {
  const properties = path.split(separator);
  return properties.reduce((prev, curr) => prev?.[curr], obj);
}
