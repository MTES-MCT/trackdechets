import { Queue } from "bull";

type WaitJobsCompletionOpts<T> = {
  fn: () => Promise<T>;
  queue: Queue;
  expectedJobCount: number;
};

/**
 * Décorateur que l'on peut utiliser dans les tests d'intégration
 * pour attendre que les différents jobs asynchrones initié par
 * une fonction (l'appel à une mutation par ex) soient terminés.
 *
 * À noter qu'il est normalement conseillé d'utiliser l'événement
 * "completed" de la queue pour ce genre de cas d'usage. Cependant dans
 * la pratique l'utilisation de queue.on("completed") semble conduire à de nombreux
 * "flaky" tests pour des raisons encore inconnues.
 */
export async function waitForJobsCompletion<T>({
  queue,
  fn,
  expectedJobCount
}: WaitJobsCompletionOpts<T>) {
  const completedCountBeforeFn = await queue.getCompletedCount();
  const result = await fn();
  let completedCount = completedCountBeforeFn;
  const expected = completedCountBeforeFn + expectedJobCount;
  while (completedCount !== expected) {
    completedCount = await queue.getCompletedCount();
  }
  return result;
}
