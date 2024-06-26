import { unescape } from "node:querystring";
import readLine from "node:readline";
import getPipelines from "./pipelines";
import traversals from "./traversals";
import { PrismaClient } from "@prisma/client";

const { DATABASE_URL, TUNNELED_DB, ROOT_OBJ } = process.env;

/*
  Console utils
*/

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questionPromise = (question: string): Promise<string> => {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
};

const blank = "\n".repeat(process.stdout.rows);
console.log(blank);
readLine.cursorTo(process.stdout, 0, 0);
readLine.clearScreenDown(process.stdout);
const print = (info: string) => {
  readLine.cursorTo(process.stdout, 0, 0);
  readLine.clearScreenDown(process.stdout);
  process.stdout.write(info);
};

/*
  Database clients init
*/

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!TUNNELED_DB) {
  throw new Error("TUNNELED_DB is not defined");
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

const prismaLocal = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: []
});

const prismaRemote = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(TUNNELED_DB) }
  },
  log: []
});

const pipelines = getPipelines(prismaLocal, prismaRemote);

/*
  The main Run method
*/
const run = async () => {
  /*
    get the origin BSD id/readableId either from ROOT_OBJ en var or user input
  */
  let rootObjId = ROOT_OBJ;
  if (!rootObjId) {
    rootObjId = await questionPromise(
      "Enter the id of the BSD (or readable ID for BSDD) you want to use as root for this partial dump : "
    );
    if (!rootObjId) {
      console.error(
        "The root BSD is not defined, please specify an object to act as the dump starting point, either by passing a ROOT_OBJ environment variable or through this prompt."
      );
      return;
    }
  }
  let originType: "Form" | "Bsdasri" | "Bsda" | "Bsff" | "Bspaoh" | "Bsvhu";
  let originId: "id" | "readableId" = "id";
  const objType = rootObjId.split("-")?.[0];

  if (!objType) {
    console.error("The root object id entered is not a valid BSD id");
    return;
  }
  /*
    Deduce the type of BSD we're starting from
  */
  switch (objType) {
    case "BSD":
      originType = "Form";
      originId = "readableId";
      break;
    case "DASRI":
      originType = "Bsdasri";
      break;
    case "BSDA":
      originType = "Bsda";
      break;
    case "FF":
      originType = "Bsff";
      break;
    case "PAOH":
      originType = "Bspaoh";
      break;
    case "VHU":
      originType = "Bsvhu";
      break;
    default:
      console.error("The root object id entered is not a valid BSD id");
      return;
  }

  /*
    Each object that gets loaded is put into one of those structItem.
    During the loading process, it becomes a deeply nested object where everything is saved.
  */
  type structItem = {
    type: string;
    obj: any;
    path: string;
    depth: number;
    children: structItem[];
  };

  const struct: structItem[] = [];

  /*
    Each object loaded also goes into this flat object, indexed by its id.
    This is the object we are getting the data when writing to the destination database
  */
  const alreadyFetched: { [key: string]: { type: string; obj: any } } = {};
  /*
    Load the root BSD
  */
  let bsds;
  try {
    bsds = await pipelines[originType].getter(originId, rootObjId);
  } catch (error) {
    console.log(error);
  }
  const bsd = bsds?.[0];
  if (!bsd) {
    console.error("Root BSD not found");
    return;
  }
  const bsdRoot: structItem = {
    type: originType,
    obj: bsd,
    path: `${originType}(${bsd.id})`,
    depth: 0,
    children: []
  };
  struct.push(bsdRoot);
  alreadyFetched[bsd.id] = {
    type: originType,
    obj: bsd
  };

  /*
    This method recursively loads the objects related to the root BSD.
    It uses the traversal object to know what to fetch and how,
    then save it to structItems and the alreadyFetched object.
    if an object is already in the "alreadyFetched" object, it doesn't get fetched again.
    Normally, at some point, we reach the end of each recursive branch
    because all related objects are already fetched or there is no related objects to fetch.
  */
  const recursiveExtract = async (root: structItem) => {
    print(`TRAVERSING ${root.path}`);
    if (!traversals[root.type]) {
      // console.log(`TRAVERSAL NOT AVAILABLE FOR ${root.type}`);
      return;
    }
    for (const item of traversals[root.type]) {
      const getter = pipelines[item.type]?.getter;
      if (!getter) {
        // console.log(`MISSING GETTER FOR ${item.type}`);
        continue;
      }
      const objects = await getter?.(item.foreignKey, root.obj[item.localKey]);
      const filteredObjects = objects?.filter(obj => {
        if (alreadyFetched[obj.id]) {
          return false;
        }
        alreadyFetched[obj.id] = {
          type: item.type,
          obj
        };
        return true;
      });
      if (filteredObjects?.length) {
        const subRoots: structItem[] = filteredObjects.map(obj => ({
          type: item.type,
          obj,
          path: `${root.path}\n${">".repeat(root.depth + 1)}${item.type}(${
            obj.id
          })`,
          depth: root.depth + 1,
          children: []
        }));
        root.children = [...root.children, ...subRoots];
      }
    }
    for (const subRoot of root.children) {
      await recursiveExtract(subRoot);
    }
  };
  await recursiveExtract(bsdRoot);

  /*
    build a little recap object to know how many objects of which type have been loaded
  */
  const statsByType = {};
  for (const id of Object.keys(alreadyFetched)) {
    if (!statsByType[alreadyFetched[id].type]) {
      statsByType[alreadyFetched[id].type] = 1;
    } else {
      statsByType[alreadyFetched[id].type] += 1;
    }
  }

  print(`DUMP COMPLETE!`);
  console.log("\n\nWhat will be copied :");
  console.log(statsByType);

  // console.log(statsByType);
  const continueRes = await questionPromise(
    "Do you want to write this to the destination database? (make sure it is empty and the schema is built) Y/N : "
  );
  if (
    continueRes !== "y" &&
    continueRes !== "Y" &&
    continueRes.toLowerCase() !== "yes"
  ) {
    console.log("ABORTING");
    return;
  }

  /*
    Now we save the loaded objects to the destination DB.
    Since there are some foreign key constraints, some objects have to be written before others
    or the writing fails.
    Since it's complicated to know the right order, I chose a more bruteforce approach:
    - Try to write all the objects
    - Remember which ones got saved
    - Do it again with the ones that didn't get saved
    - Stop when everything is saved

    This has a risk of never ending, for example if there is a write error that is not
    caused by a foreign key constraint (conflicting id of the db was not empty,
    wrong format if the schema is different between source and destination, ...).
    To avoid an infinite loop, I had a check that at least one object is saved on each iteration.
    This way if we're stuck and nothing gets saved, we abort.
  */
  const alreadySaved: { [key: string]: boolean } = {};
  const allSaved = () => {
    return !Object.keys(alreadyFetched).some(id => !alreadySaved[id]);
  };
  let successfulSaves;
  while (!allSaved()) {
    successfulSaves = 0;
    for (const id of Object.keys(alreadyFetched)) {
      if (alreadySaved[id]) {
        continue;
      }
      const setter = pipelines[alreadyFetched[id].type]?.setter;
      if (!setter) {
        throw new Error(`no setter for type ${alreadyFetched[id].type}`);
      }
      try {
        await setter(alreadyFetched[id].obj);
        alreadySaved[id] = true;
        successfulSaves += 1;
        print(`saved ${alreadyFetched[id].type} ${id}`);
      } catch (error) {
        // console.log(`could not save ${alreadyFetched[id].type} ${id}`);
      }
    }
    if (successfulSaves === 0) {
      console.error(
        "There seems to be a problem writing to the database. Is it empty? Is the schema the same as the one you're trying to copy from?"
      );
      return;
    }
  }
  print(
    "ALL DONE ! remember to reindex to elastic ( > npx nx run back:reindex-all-bsds-bulk -- -f )"
  );
};

run().then(
  () => rl.close(),
  () => rl.close()
);
