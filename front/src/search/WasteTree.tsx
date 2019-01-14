import React from "react";
import Tree, { TreeNode } from "rc-tree";
import Wastes from "../login/nomenclature.json";
import "rc-tree/assets/index.css";

type Node = { fullKey: string; title: string; children: Node[] };
const loop = (data: Node[]) => {
  return data.map(item => {
    if (item.children) {
      return (
        <TreeNode key={item.fullKey} title={`${item.fullKey} - ${item.title}`}>
          {loop(item.children)}
        </TreeNode>
      );
    }
    return <TreeNode key={item.fullKey} title={item.title} />;
  });
};

type Props = { checkable?: boolean };
export default function WasteTree(props: Props) {
  return (
    <Tree className="myCls" showLine {...props}>
      {loop(Wastes)}
    </Tree>
  );
}
