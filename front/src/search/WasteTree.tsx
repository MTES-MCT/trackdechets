import React from "react";
import Tree, { TreeNode } from "rc-tree";
import { WASTES_TREE, WasteNode } from "src/generated/constants/WASTES";
import "rc-tree/assets/index.css";

const loop = (data: WasteNode[]) => {
  return data.map(item => {
    if (item.children) {
      return (
        <TreeNode key={item.code} title={`${item.code} - ${item.description}`}>
          {loop(item.children)}
        </TreeNode>
      );
    }
    return <TreeNode key={item.code} title={item.description} />;
  });
};

type Props = { checkable?: boolean; onSelect?: (selectedKeys: any) => void };
export default function WasteTree(props: Props) {
  return (
    <Tree className="myCls" showLine {...props}>
      {loop(WASTES_TREE)}
    </Tree>
  );
}
