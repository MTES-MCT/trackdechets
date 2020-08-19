import { ErrorCode } from "../../common/errors";

/**
 * fallback to fn2 if fn1 fails
 */
export function redundant<T>(
  fn1: (...args) => Promise<T>,
  fn2: (...args) => Promise<T>
) {
  const redundantFn = async (...args) => {
    try {
      // try fn1
      const response1 = await fn1(...args);
      return response1;
    } catch (err1) {
      if (
        // fn1 has failed
        err1.response?.status >= 500 ||
        err1.extensions?.code === ErrorCode.TOO_MANY_REQUESTS
      ) {
        try {
          // try fn2
          const response2 = await fn2(...args);
          return response2;
        } catch (err2) {
          // fn2 has also fails, throw err1
          throw err1;
        }
      } else {
        throw err1;
      }
    }
  };

  return redundantFn;
}
