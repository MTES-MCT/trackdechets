import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import legacy from "@vitejs/plugin-legacy";
import svgrPlugin from "vite-plugin-svgr";
import path from "path";
import { readdirSync } from "fs";

const srcPath = path.resolve("./src");
const srcRootContent = readdirSync(srcPath, {
  withFileTypes: true,
}).map(dirent => dirent.name.replace(/(\.ts){1}(x?)/, ""));

const absolutePathAliases: Record<string, string> = srcRootContent.reduce(
  (aliases, directory) => {
    aliases[directory] = path.join(srcPath, directory);
    return aliases;
  },
  {}
);

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    sourcemap: true,
  },
  plugins: [
    reactRefresh(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
    legacy({
      targets: ["ie >= 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: absolutePathAliases,
  },
});
