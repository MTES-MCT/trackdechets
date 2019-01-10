import React, { useRef, useEffect } from "react";
import "./Search.scss";
import * as typeformEmbed from "@typeform/embed";

export default function Search() {
  const typeFormRef = useRef(null);
  useEffect(() => {
    typeformEmbed.makeWidget(
      typeFormRef.current,
      "https://xpedition.typeform.com/to/ERgvv5",
      {}
    );
  }, []);

  return (
    <div className="Search section section-grey">
      <div className="container">
        <div ref={typeFormRef} className="typeform" />
      </div>
    </div>
  );
}
