import type { ProblemMeta, TestCase } from "../../lib/problems/types";

class JsListNode { constructor(public val: number, public next: JsListNode | null = null) {} }
class JsTreeNode { constructor(public val: number, public left: JsTreeNode | null = null, public right: JsTreeNode | null = null) {} }

type ParamType = ProblemMeta["signature"]["params"][number];

function deserialize(arg: unknown, t: ParamType): unknown {
  if (typeof t === "string") return arg;
  if ("array" in t) return (arg as unknown[]).map((x) => deserialize(x, t.array));
  if ("grid" in t) return (arg as unknown[][]).map((row) => row.map((x) => deserialize(x, (t as { grid: ParamType }).grid)));
  if ("linked_list" in t) {
    const vs = arg as unknown[];
    if (!vs || vs.length === 0) return null;
    const head = new JsListNode(vs[0] as number);
    let cur: JsListNode = head;
    for (let i = 1; i < vs.length; i++) { cur.next = new JsListNode(vs[i] as number); cur = cur.next; }
    return head;
  }
  if ("tree" in t) {
    const arr = arg as Array<number | null>;
    if (!arr || arr.length === 0) return null;
    const root = new JsTreeNode(arr[0] as number);
    const q: JsTreeNode[] = [root]; let i = 1;
    while (q.length && i < arr.length) {
      const node = q.shift()!;
      if (arr[i] !== null && arr[i] !== undefined) { node.left = new JsTreeNode(arr[i] as number); q.push(node.left); }
      i++;
      if (i >= arr.length) break;
      if (arr[i] !== null && arr[i] !== undefined) { node.right = new JsTreeNode(arr[i] as number); q.push(node.right); }
      i++;
    }
    return root;
  }
  return arg;
}

function serialize(val: unknown, t: ParamType): unknown {
  if (typeof t === "string") return val;
  if ("array" in t) return ((val as unknown[]) ?? []).map((x) => serialize(x, t.array));
  if ("grid" in t) return ((val as unknown[][]) ?? []).map((row) => row.map((x) => serialize(x, (t as { grid: ParamType }).grid)));
  if ("linked_list" in t) {
    const out: number[] = []; let n = val as JsListNode | null;
    while (n) { out.push(n.val); n = n.next; }
    return out;
  }
  if ("tree" in t) {
    if (!val) return [];
    const out: Array<number | null> = []; const q: Array<JsTreeNode | null> = [val as JsTreeNode];
    while (q.length) {
      const node = q.shift()!;
      if (node === null) { out.push(null); continue; }
      out.push(node.val); q.push(node.left); q.push(node.right);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }
  return val;
}

export interface RawResult {
  index: number; actual: unknown; stdout: string; error?: string; elapsedMs: number;
}

export function runTests(userCode: string, meta: ProblemMeta, tests: TestCase[]): RawResult[] {
  const params = meta.signature.params; const returns = meta.signature.returns;
  (globalThis as Record<string, unknown>).ListNode = JsListNode;
  (globalThis as Record<string, unknown>).TreeNode = JsTreeNode;
  // The Function constructor scopes user code to globalThis only.
  // __harness_args__ is reserved (CI lint rejects this token in reference solutions).
  // NOTE: new Function is intentional here — this is a sandboxed code execution harness.
  const userFn = new Function(
    "__harness_args__",
    `${userCode}\nreturn ${meta.entry}.apply(null, __harness_args__);`,
  ) as (a: unknown[]) => unknown;

  return tests.map((tc, i): RawResult => {
    const captured: string[] = [];
    const origLog = console.log;
    console.log = (...a) => { captured.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")); };
    const t0 = performance.now();
    try {
      const args = tc.input.map((v, j) => deserialize(v, params[j]));
      const out = userFn(args);
      const actual = serialize(out, returns);
      return { index: i, actual, stdout: captured.join("\n"), elapsedMs: performance.now() - t0 };
    } catch (e) {
      const err = e as Error;
      return { index: i, actual: null, stdout: captured.join("\n"), error: `${err.name}: ${err.message}`, elapsedMs: performance.now() - t0 };
    } finally {
      console.log = origLog;
    }
  });
}
