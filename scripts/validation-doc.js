const ts = require("typescript");
const fs = require("fs");
const path = require("path");

/**
 * TODO
 * - gestion des objets de règles transporter/packaging séparés
 * - ajout d'en-têtes custom ou de la possibilité d'insérer le tableau au sein d'un markdown avec d'autres textes
 *   plutôt que remplacer tout le fichier
 */

const rules = {
  BSDA: {
    ruleObjName: "bsdaEditionRules",
    path: "../back/src/bsda/validation/rules.ts"
  },
  BSFF: {
    ruleObjName: "bsffEditionRules",
    path: "../back/src/bsffs/validation/bsff/rules.ts"
  },
  BSPAOH: {
    ruleObjName: "editionRules",
    path: "../back/src/bspaoh/validation/rules.ts"
  },
  BSVHU: {
    ruleObjName: "bsvhuEditionRules",
    path: "../back/src/bsvhu/validation/rules.ts"
  },
  BSDASRI: {
    ruleObjName: "bsdasriEditionRules",
    path: "../back/src/bsdasris/validation/rules.ts"
  }
};

// Helper function to retrieve leading comments for a node
function getLeadingComments(node, sourceFile) {
  const commentRanges = ts.getLeadingCommentRanges(
    sourceFile.getFullText(),
    node.getFullStart()
  );
  if (!commentRanges) return [];
  return commentRanges.map(range =>
    sourceFile.getFullText().slice(range.pos, range.end).trim()
  );
}

// Function to extract information from an object literal expression
function extractObjectInformation(objectLiteral, sourceFile) {
  const collectedInfo = {};

  objectLiteral.properties.forEach(property => {
    if (ts.isPropertyAssignment(property)) {
      const key = property.name.text;
      const obj = {};

      if (ts.isObjectLiteralExpression(property.initializer)) {
        property.initializer.properties.forEach(subProperty => {
          if (ts.isPropertyAssignment(subProperty)) {
            const propName = subProperty.name.text;

            if (ts.isObjectLiteralExpression(subProperty.initializer)) {
              // Handle nested objects (like sealed, required)
              const nestedObj = {};

              subProperty.initializer.properties.forEach(nestedProperty => {
                if (ts.isPropertyAssignment(nestedProperty)) {
                  const nestedKey = nestedProperty.name.text;
                  if (ts.isStringLiteral(nestedProperty.initializer)) {
                    nestedObj[nestedKey] = nestedProperty.initializer.text;
                  } else if (
                    ts.isArrowFunction(nestedProperty.initializer) ||
                    ts.isFunctionExpression(nestedProperty.initializer)
                  ) {
                    // Handle direct arrow functions within the object
                    nestedObj[nestedKey] = {
                      function: nestedProperty.initializer.getText(sourceFile),
                      comments: getLeadingComments(nestedProperty, sourceFile)
                    };
                  } else if (ts.isIdentifier(nestedProperty.initializer)) {
                    nestedObj[nestedKey] = {
                      reference: nestedProperty.initializer.getText(sourceFile),
                      comments: getLeadingComments(nestedProperty, sourceFile)
                    };
                  } else {
                    nestedObj[nestedKey] =
                      nestedProperty.initializer.getText(sourceFile);
                  }
                }
              });

              obj[propName] = nestedObj;
            } else if (ts.isArrayLiteralExpression(subProperty.initializer)) {
              // Convert array to dot notation string
              const pathString = subProperty.initializer.elements
                .map(element => {
                  if (ts.isStringLiteral(element)) {
                    return element.text;
                  }
                  return element.getText(sourceFile);
                })
                .join(".");
              obj[propName] = pathString;
            } else if (ts.isStringLiteral(subProperty.initializer)) {
              obj[propName] = subProperty.initializer.text;
            } else {
              obj[propName] = subProperty.initializer.getText(sourceFile);
            }
          }
        });
      }

      collectedInfo[key] = obj;
    }
  });

  return collectedInfo;
}

// Find the rules object in the AST
function findEditionRules(node, objName, setInfos, sourceFile) {
  if (ts.isVariableStatement(node)) {
    const declarationList = node.declarationList;
    declarationList.declarations.forEach(declaration => {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === objName
      ) {
        if (ts.isObjectLiteralExpression(declaration.initializer)) {
          setInfos(
            extractObjectInformation(
              declaration.initializer,
              sourceFile ?? node
            )
          );
        }
      }
    });
  }

  // Continue searching through child nodes
  ts.forEachChild(node, node2 =>
    findEditionRules(node2, objName, setInfos, sourceFile ?? node)
  );
}

const buildStructure = rawInfos => {
  const struct = [];
  const refs = {};
  for (const field in rawInfos) {
    const element = rawInfos[field];
    let res = {};
    res.id = field;
    res.name = element.readableFieldName;
    res.path = element.path;
    if (element.required) {
      if (element.required.from) {
        if (element.required.from.comments) {
          if (element.required.from.comments[0]) {
            res.requiredFrom = element.required.from.comments[0].replace(
              /^\/\/\s*/,
              ""
            );
            if (
              element.required.from.reference &&
              !refs[element.required.from.reference]
            ) {
              refs[element.required.from.reference] = res.requiredFrom;
            }
          } else if (
            element.required.from.reference &&
            refs[element.required.from.reference]
          ) {
            res.requiredFrom = refs[element.required.from.reference];
          }
        } else if (typeof element.required.from === "string") {
          res.requiredFrom = element.required.from;
        }
      }
      if (element.required.when) {
        if (element.required.when.comments) {
          if (element.required.when.comments[0]) {
            res.requiredWhen = element.required.when.comments[0].replace(
              /^\/\/\s*/,
              ""
            );
            if (
              element.required.when.reference &&
              !refs[element.required.when.reference]
            ) {
              refs[element.required.when.reference] = res.requiredWhen;
            }
          } else if (
            element.required.when.reference &&
            refs[element.required.when.reference]
          ) {
            res.requiredWhen = refs[element.required.when.reference];
          }
        } else if (typeof element.required.when === "string") {
          res.requiredWhen = element.required.when;
        }
      }
    }
    if (element.sealed) {
      if (element.sealed.from) {
        if (element.sealed.from.comments) {
          if (element.sealed.from.comments[0]) {
            res.sealedFrom = element.sealed.from.comments[0].replace(
              /^\/\/\s*/,
              ""
            );
            if (
              element.sealed.from.reference &&
              !refs[element.sealed.from.reference]
            ) {
              refs[element.sealed.from.reference] = res.sealedFrom;
            }
          } else if (
            element.sealed.from.reference &&
            refs[element.sealed.from.reference]
          ) {
            res.sealedFrom = refs[element.sealed.from.reference];
          }
        } else if (typeof element.sealed.from === "string") {
          res.sealedFrom = element.sealed.from;
        }
      }
      if (element.sealed.when) {
        if (element.sealed.when.comments) {
          if (element.sealed.when.comments[0]) {
            res.sealedWhen = element.sealed.when.comments[0].replace(
              /^\/\/\s*/,
              ""
            );
            if (
              element.sealed.when.reference &&
              !refs[element.sealed.when.reference]
            ) {
              refs[element.sealed.when.reference] = res.sealedWhen;
            }
          } else if (
            element.sealed.when.reference &&
            refs[element.sealed.when.reference]
          ) {
            res.sealedWhen = refs[element.sealed.when.reference];
          }
        } else if (typeof element.sealed.when === "string") {
          res.sealedWhen = element.sealed.when;
        }
      }
    }
    struct.push(res);
  }
  return struct;
};

const toMDTable = structure => {
  const firstLine = {
    id: "id",
    name: "Nom du champ",
    path: "Chemin GraphQL",
    requiredFrom: "Requis à partir de",
    requiredWhen: "Requis si",
    sealedFrom: "Scellé à partir de",
    sealedWhen: "Scellé si"
  };
  const maxLengths = {
    id: firstLine.id.length,
    name: firstLine.name.length,
    path: firstLine.path.length,
    requiredFrom: firstLine.requiredFrom.length,
    requiredWhen: firstLine.requiredWhen.length,
    sealedFrom: firstLine.sealedFrom.length,
    sealedWhen: firstLine.sealedWhen.length
  };
  for (const element of structure) {
    if (element.id?.length && element.id.length > maxLengths.id) {
      maxLengths.id = element.id.length;
    }
    if (element.name?.length && element.name.length > maxLengths.name) {
      maxLengths.name = element.name.length;
    }
    if (element.path?.length && element.path.length > maxLengths.path) {
      maxLengths.path = element.path.length;
    }
    if (
      element.requiredFrom?.length &&
      element.requiredFrom.length > maxLengths.requiredFrom
    ) {
      maxLengths.requiredFrom = element.requiredFrom.length;
    }
    if (
      element.requiredWhen?.length &&
      element.requiredWhen.length > maxLengths.requiredWhen
    ) {
      maxLengths.requiredWhen = element.requiredWhen.length;
    }
    if (
      element.sealedFrom?.length &&
      element.sealedFrom.length > maxLengths.sealedFrom
    ) {
      maxLengths.sealedFrom = element.sealedFrom.length;
    }
    if (
      element.sealedWhen?.length &&
      element.sealedWhen.length > maxLengths.sealedWhen
    ) {
      maxLengths.sealedWhen = element.sealedWhen.length;
    }
  }
  const writeLine = element => {
    return `| ${element.name || "-"}${" ".repeat(
      maxLengths.name - (element.name?.length ?? 1)
    )} | ${element.path || "-"}${" ".repeat(
      maxLengths.path - (element.path?.length ?? 1)
    )} | ${element.requiredFrom || "-"}${" ".repeat(
      maxLengths.requiredFrom - (element.requiredFrom?.length ?? 1)
    )} | ${element.requiredWhen || "-"}${" ".repeat(
      maxLengths.requiredWhen - (element.requiredWhen?.length ?? 1)
    )} | ${element.sealedFrom || "-"}${" ".repeat(
      maxLengths.sealedFrom - (element.sealedFrom?.length ?? 1)
    )} | ${element.sealedWhen || "-"}${" ".repeat(
      maxLengths.sealedWhen - (element.sealedWhen?.length ?? 1)
    )} |\n`;
  };
  const writeSeparator = () => {
    return `| ${"-".repeat(maxLengths.name)} | ${"-".repeat(
      maxLengths.path
    )} | ${"-".repeat(maxLengths.requiredFrom)} | ${"-".repeat(
      maxLengths.requiredWhen
    )} | ${"-".repeat(maxLengths.sealedFrom)} | ${"-".repeat(
      maxLengths.sealedWhen
    )} |\n`;
  };
  let table = writeLine(firstLine);
  table = `${table}${writeSeparator()}`;
  for (const element of structure) {
    table = `${table}${writeLine(element)}`;
  }
  return table;
};

const writeToFile = (bsd, table) => {
  const relativePath = `../apps/doc/docs/reference/validation/${bsd.toLowerCase()}.md`;
  const outputPath = path.join(__dirname, relativePath);
  try {
    if (
      !fs.existsSync(
        path.join(__dirname, "../apps/doc/docs/reference/validation/")
      )
    ) {
      fs.mkdirSync(
        path.join(__dirname, "../apps/doc/docs/reference/validation/"),
        { recursive: true }
      );
    }
    // Write the string to a file
    fs.writeFileSync(outputPath, table, "utf-8");
    console.log(`Data written to ${outputPath}`);
  } catch (err) {
    console.error("Error writing to file:", err);
  }
};

const run = () => {
  for (const bsd in rules) {
    // The path to your TypeScript file
    const absolutePathToRules = path.join(__dirname, rules[bsd].path);

    // Read the file content
    const sourceCode = fs.readFileSync(absolutePathToRules, "utf-8");
    const sourceFile = ts.createSourceFile(
      absolutePathToRules,
      sourceCode,
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ true
    );
    // Start searching in the SourceFile
    let infos;
    setInfos = input => (infos = input);
    findEditionRules(sourceFile, rules[bsd].ruleObjName, setInfos);
    const structured = buildStructure(infos);
    const table = `---\ntitle: ${bsd}\n---\n${toMDTable(structured)}`;
    writeToFile(bsd, table);
  }
};
run();
