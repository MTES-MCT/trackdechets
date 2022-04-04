import React, { ReactNode } from "react";
import supportedBrowsers from "./supportedBrowsers";

type Props = {
  children: ReactNode;
};

export default function BrowserDetect({ children }: Props) {
  // test user agent against a regex generated from .browserslistrc
  // thanks to browserslist-useragent-regexp library
  if (supportedBrowsers.test(navigator.userAgent)) {
    return <div>{children}</div>;
  } else {
    window.location.replace("/unsupport.html");
    return null;
  }
}
