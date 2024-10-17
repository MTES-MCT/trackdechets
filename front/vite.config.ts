import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
import svgrPlugin from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  build: {
    outDir: "../dist/front",
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    sourcemap: true
  },
  cacheDir: "../node_modules/.vite/front",
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin([
      "../node_modules/@codegouvfr/react-dsfr/favicon/*.*",
      "../node_modules/@codegouvfr/react-dsfr/main.css"
    ]),
    svgrPlugin({
      svgrOptions: {
        icon: true
        // ...svgr options (https://react-svgr.com/docs/options/)
      }
    })
  ],
  server: {
    port: 3000,
    host: "localhost",
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    }
  },
  preview: {
    port: 3001,
    host: "localhost"
  }
});
