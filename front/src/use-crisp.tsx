import { useEffect } from "react";

export default function useCrisp() {
  useEffect(() => {
    // CRISP
    (window as any).$crisp = [];
    (window as any).CRISP_WEBSITE_ID = "11231caa-e6f1-436b-addc-eec1e0ddf040";

    (function() {
      var d = document;
      var s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);
}
