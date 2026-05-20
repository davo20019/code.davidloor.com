def lowestCommonAncestor(root, p, q):
    while root:
        if p < root.val and q < root.val: root = root.left
        elif p > root.val and q > root.val: root = root.right
        else: return root.val
    return -1
