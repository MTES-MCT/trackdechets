import React from "react";
import Tree, { TreeNode } from "rc-tree";
import "rc-tree/assets/index.css";
import Wastes from "./nomenclature.json";
import { Link } from "react-router-dom";

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

export default function WasteSelector() {
  return (
    <div className="container">
      <h2>Sélection des codes déchets autorisés</h2>
      <Tree className="myCls" showLine checkable>
        {loop(Wastes)}
      </Tree>

      <Link to="/dashboard/slips" className="button secondary">
        Ignorer
      </Link>
      <Link to="/dashboard/slips" className="button">
        Valider
      </Link>
    </div>
  );
}
