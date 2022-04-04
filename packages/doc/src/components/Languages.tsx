import React from "react";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import CodeBlock from "@theme/CodeBlock";
import MePython from "!!raw-loader!../snippets/me.py";

const Languages = () => (
  <Tabs defaultValue="python" values={[{ label: "Python", value: "python" }]}>
    <TabItem value="python">
      <CodeBlock className="python">{MePython}</CodeBlock>
    </TabItem>
  </Tabs>
);

export default Languages;
