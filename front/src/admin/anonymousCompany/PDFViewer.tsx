import React from "react";

// Probably has bad compatibility with all browsers, but for admin use anyways
export const PDFViewer = ({ pdf }) => {
  if (!pdf) {
    return null;
  }

  return (
    <object
      className="fr-my-2w"
      width="100%"
      height="100%"
      style={{ minHeight: "400px" }}
      data={`data:application/pdf;base64,${pdf}#zoom=95&navpanes=0`}
      type="application/pdf"
    ></object>
  );
};
