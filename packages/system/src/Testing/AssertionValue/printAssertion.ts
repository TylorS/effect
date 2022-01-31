// ets_tracing: off

import type { AssertionValue } from "../AssertionValue/index.js"

export function printAssertion(as: AssertionValue): string {
  return as.assertion.toString()
}
