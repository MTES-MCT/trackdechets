import React from "react";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import CodeBlock from "@theme/CodeBlock";
import bsddPdf from "!!raw-loader!../snippets/pdf/bsdd/pdf.gql";
import bsddPdfResponse from "!!raw-loader!../snippets/pdf/bsdd/response.txt";
import bsdasriPdf from "!!raw-loader!../snippets/pdf/bsdasri/pdf.gql";
import bsdasriPdfResponse from "!!raw-loader!../snippets/pdf/bsdasri/response.txt";
import bsvhuPdf from "!!raw-loader!../snippets/pdf/bsvhu/pdf.gql";
import bsvhuPdfResponse from "!!raw-loader!../snippets/pdf/bsvhu/response.txt";
import bsdaPdf from "!!raw-loader!../snippets/pdf/bsda/pdf.gql";
import bsdaPdfResponse from "!!raw-loader!../snippets/pdf/bsda/response.txt";
import bsffPdf from "!!raw-loader!../snippets/pdf/bsff/pdf.gql";
import bsffPdfResponse from "!!raw-loader!../snippets/pdf/bsff/response.txt";

const ExportPdf = () => {
  return (
    <Tabs
      defaultValue="bsdd"
      values={[
        { label: "Déchets dangereux", value: "bsdd" },
        { label: "DASRI", value: "bsdasri" },
        { label: "VHU", value: "bsvhu" },
        { label: "Amiante", value: "bsda" },
        { label: "Fluides Frigo", value: "bsff" },
      ]}
    >
      <TabItem value="bsdd">
        <CodeBlock className="graphql">{bsddPdf}</CodeBlock>
        <CodeBlock className="json">{bsddPdfResponse}</CodeBlock>
      </TabItem>
      <TabItem value="bsdasri">
        <CodeBlock className="graphql">{bsdasriPdf}</CodeBlock>
        <CodeBlock className="json">{bsdasriPdfResponse}</CodeBlock>
      </TabItem>
      <TabItem value="bsvhu">
        <CodeBlock className="graphql">{bsvhuPdf}</CodeBlock>
        <CodeBlock className="json">{bsvhuPdfResponse}</CodeBlock>
      </TabItem>
      <TabItem value="bsda">
        <CodeBlock className="graphql">{bsdaPdf}</CodeBlock>
        <CodeBlock className="json">{bsdaPdfResponse}</CodeBlock>
      </TabItem>
      <TabItem value="bsff">
        <CodeBlock className="graphql">{bsffPdf}</CodeBlock>
        <CodeBlock className="json">{bsffPdfResponse}</CodeBlock>
      </TabItem>
    </Tabs>
  );
};

export default ExportPdf;
