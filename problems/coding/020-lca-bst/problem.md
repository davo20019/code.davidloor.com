# Lowest Common Ancestor of a BST

Given a Binary Search Tree (BST) and two node values `p` and `q`, find the lowest common ancestor (LCA) of the two nodes.

The LCA is defined as the lowest node in the tree that has both `p` and `q` as descendants (a node is a descendant of itself).

Return the **value** at the LCA node (not the node itself).

## Example

Input: `root = [6,2,8,0,4,7,9,null,null,3,5]`, `p = 2`, `q = 8`
Output: `6`
Explanation: The LCA of nodes 2 and 8 is 6 (the root), since 2 is in the left subtree and 8 is in the right subtree.

Input: `root = [6,2,8,0,4,7,9,null,null,3,5]`, `p = 2`, `q = 4`
Output: `2`
Explanation: The LCA of nodes 2 and 4 is 2, since 4 is in the subtree rooted at 2.

## Constraints
- The number of nodes in the tree is in the range [2, 10^5]
- -10^9 <= Node.val <= 10^9
- All node values are unique
- p != q
- p and q will exist in the BST
