export type ParamType =
  | "int" | "float" | "bool" | "string"
  | { array: ParamType }
  | { linked_list: ParamType }
  | { tree: ParamType }     // BFS-array form
  | { grid: ParamType };

export type ValidatorSpec =
  | { kind: "exact" }
  | { kind: "set" }
  | { kind: "set_of_lists" }
  | { kind: "set_of_sets" }
  | { kind: "any_of" }      // `expected` is an array of acceptable answers
  | { kind: "linked_list_value_equal" }
  | { kind: "tree_isomorphic" };

export interface Signature {
  params: ParamType[];
  returns: ParamType;
}

export interface TestCase {
  input: unknown[];
  expected: unknown;
}

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  topics: string[];
  entry: string;        // function name
  signature: Signature;
  validator: ValidatorSpec;
  timeLimitMs: number;  // default 5000
}

export interface CodingProblem {
  type: "coding";
  meta: ProblemMeta;
  statementMarkdown: string;
  starters: { python: string; javascript: string };
  solutions: { python: string; javascript: string };
  tests: TestCase[];
}

export interface SystemDesignMeta {
  id: string;
  title: string;
  estMinutes: number;
  tags: string[];
}

export interface SystemDesignProblem {
  type: "system_design";
  meta: SystemDesignMeta;
  promptMarkdown: string;
}

export type Problem = CodingProblem | SystemDesignProblem;
