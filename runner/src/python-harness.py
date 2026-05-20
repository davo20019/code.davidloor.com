import json, sys, io, time

class _Capture(io.StringIO):
    pass

class ListNode:
    def __init__(self, val=0, nxt=None):
        self.val = val; self.next = nxt
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val; self.left = left; self.right = right

def _deserialize(arg, t):
    if isinstance(t, str): return arg
    if isinstance(t, dict):
        if "array" in t: return [_deserialize(x, t["array"]) for x in arg]
        if "grid" in t:
            inner = t["grid"]
            return [[_deserialize(x, inner) for x in row] for row in arg]
        if "linked_list" in t:
            if not arg: return None
            head = ListNode(arg[0]); cur = head
            for v in arg[1:]:
                cur.next = ListNode(v); cur = cur.next
            return head
        if "tree" in t:
            if not arg: return None
            it = iter(arg); root = TreeNode(next(it)); q = [root]
            while q:
                node = q.pop(0)
                try: lv = next(it)
                except StopIteration: break
                if lv is not None: node.left = TreeNode(lv); q.append(node.left)
                try: rv = next(it)
                except StopIteration: break
                if rv is not None: node.right = TreeNode(rv); q.append(node.right)
            return root
    return arg

def _serialize(val, t):
    if isinstance(t, str): return val
    if isinstance(t, dict):
        if "array" in t: return [_serialize(x, t["array"]) for x in (val or [])]
        if "grid" in t:
            inner = t["grid"]
            return [[_serialize(x, inner) for x in row] for row in (val or [])]
        if "linked_list" in t:
            out = []; n = val
            while n is not None:
                out.append(n.val); n = n.next
            return out
        if "tree" in t:
            if val is None: return []
            out = []; q = [val]
            while q:
                node = q.pop(0)
                if node is None: out.append(None); continue
                out.append(node.val); q.append(node.left); q.append(node.right)
            while out and out[-1] is None: out.pop()
            return out
    return val

def run_problem(user_code, problem_meta_json, tests_json):
    meta = json.loads(problem_meta_json); tests = json.loads(tests_json)
    entry = meta["entry"]; params = meta["signature"]["params"]; returns = meta["signature"]["returns"]
    ns = {"ListNode": ListNode, "TreeNode": TreeNode}
    exec(user_code, ns, ns)
    if entry not in ns:
        return json.dumps({"error": f"entry function '{entry}' not defined"})
    fn = ns[entry]
    per = []
    for i, tc in enumerate(tests):
        cap = _Capture(); old = sys.stdout; sys.stdout = cap
        t0 = time.perf_counter()
        try:
            args = [_deserialize(a, params[j]) for j, a in enumerate(tc["input"])]
            actual_raw = fn(*args)
            actual = _serialize(actual_raw, returns)
            per.append({"index": i, "actual": actual, "stdout": cap.getvalue(), "elapsedMs": (time.perf_counter() - t0) * 1000.0})
        except Exception as e:
            per.append({"index": i, "actual": None, "stdout": cap.getvalue(), "error": f"{type(e).__name__}: {e}", "elapsedMs": (time.perf_counter() - t0) * 1000.0})
        finally:
            sys.stdout = old
    return json.dumps(per)
