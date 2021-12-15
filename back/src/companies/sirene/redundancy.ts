import type { AsyncReturnType } from "type-fest";

/**
 * Loop over the functions until one of them returns a result
 */
export function redundant<F extends (...args: any[]) => any>(...fns: F[]) {
  return async (...args: Parameters<F>): Promise<AsyncReturnType<F>> => {
    let firstError: Error | null = null;

    for (const fn of fns) {
      try {
        const response = await fn(...args);
        return response;
      } catch (error) {
        if (firstError == null) {
          firstError = error;
        }
      }
    }

    throw firstError;
  };
}
