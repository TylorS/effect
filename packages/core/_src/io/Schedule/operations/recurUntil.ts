/**
 * A schedule that recurs for until the predicate evaluates to true.
 *
 * @tsplus static ets/Schedule/Ops recurUntil
 */
export function recurUntil<A>(
  f: Predicate<A>
): Schedule.WithState<void, unknown, A, A> {
  return Schedule.identity<A>().untilInput(f);
}