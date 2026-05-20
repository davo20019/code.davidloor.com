import type { ValidatorSpec } from "@/lib/problems/types";
import { exactEqual } from "./exact";
import { setEqual } from "./set";
import { setOfListsEqual } from "./set-of-lists";
import { setOfSetsEqual } from "./set-of-sets";
import { anyOfEqual } from "./any-of";

export function validate(spec: ValidatorSpec, actual: unknown, expected: unknown): boolean {
  switch (spec.kind) {
    case "exact": return exactEqual(actual, expected);
    case "set": return setEqual(actual, expected);
    case "set_of_lists": return setOfListsEqual(actual, expected);
    case "set_of_sets": return setOfSetsEqual(actual, expected);
    case "any_of": return anyOfEqual(actual, expected);
    case "linked_list_value_equal":
    case "tree_isomorphic":
      // The Python/JS harness serializes these to plain arrays before crossing
      // the worker boundary, so an exact compare is correct here.
      return exactEqual(actual, expected);
  }
}
