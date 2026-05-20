import { describe, it, expect } from "vitest";
import { validate } from "@/lib/validators";

describe("validator dispatch", () => {
  it("dispatches by kind", () => {
    expect(validate({ kind: "exact" }, 1, 1)).toBe(true);
    expect(validate({ kind: "set" }, [1, 2], [2, 1])).toBe(true);
    expect(validate({ kind: "set_of_sets" }, [[1, 2]], [[2, 1]])).toBe(true);
    expect(validate({ kind: "any_of" }, [1, 2], [[1, 2], [2, 1]])).toBe(true);
    // Pass-through validators expect Python/JS-side serialization to plain arrays.
    expect(validate({ kind: "linked_list_value_equal" }, [1, 2, 3], [1, 2, 3])).toBe(true);
    expect(validate({ kind: "tree_isomorphic" }, [1, 2, null, 3], [1, 2, null, 3])).toBe(true);
  });
});
