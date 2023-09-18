const ts = require("typescript");
const { build } = require("esbuild");
const copyfiles = require("copyfiles");

const config = {
  esbuild: {
    tsconfig: "tsconfig.json"
  },
  postbuild: async () => {
    console.info("Copying static files...");
    return new Promise(resolve =>
      copyfiles(
        [
          "src/**/*.{graphql,pdf,png,ttf,html,css,svg,wsdl,mp3}",
          "src/**/assets/*.js",
          "prisma/**/*.{prisma,sql}",
          "dist" // Out dir
        ],
        {},
        resolve
      )
    );
  }
};

async function main() {
  const esbuildConfig = config.esbuild || {};
  const { tsConfig } = getTSConfig(esbuildConfig.tsconfig);

  const outdir = esbuildConfig.outdir || tsConfig.options.outDir || "dist";
  const srcFiles = [
    ...(esbuildConfig.entryPoints ?? []),
    ...tsConfig.fileNames
  ];

  const sourcemap = config.esbuild?.sourcemap || false;
  const target =
    esbuildConfig?.target || tsConfig?.raw?.compilerOptions?.target || "es6";

  const esbuildOptions = {
    ...config.esbuild,
    outdir,
    entryPoints: srcFiles,
    sourcemap,
    target: target.toLowerCase()
  };

  if (config.prebuild) {
    await config.prebuild();
  }

  console.info("Building files...");
  await build({
    bundle: false,
    format: "cjs",
    platform: "node",
    ...esbuildOptions
  });

  if (config.postbuild) {
    await config.postbuild();
  }
}

function getTSConfig(tsConfigPath = "tsconfig.json") {
  const cwd = process.cwd();
  const tsConfigFile = ts.findConfigFile(cwd, ts.sys.fileExists, tsConfigPath);
  if (!tsConfigFile) {
    throw new Error(
      `${tsConfigPath} not found in the current directory! ${cwd}`
    );
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd
  );
  return { tsConfig, tsConfigFile };
}

console.time("Built in");

main()
  .then(() => {
    console.timeEnd("Built in");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
