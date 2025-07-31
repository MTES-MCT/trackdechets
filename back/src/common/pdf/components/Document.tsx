import * as React from "react";
import path from "path";

const { ENV_NAME } = process.env;
const ASSETS_PATH = path.join(__dirname, "..", "assets");

export const CSS_PATHS = [
  path.join(ASSETS_PATH, "modern-normalize.css"),
  path.join(ASSETS_PATH, "styles.css")
];

type DocumentProps = React.PropsWithChildren<{
  title: string;
}>;

export function Document({ title, children }: DocumentProps) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <title>{title}</title>
        {CSS_PATHS.map((cssPath, index) => (
          <link key={index} rel="stylesheet" href={path.basename(cssPath)} />
        ))}
      </head>
      <body className={ENV_NAME ?? ""}>{children}</body>
    </html>
  );
}
