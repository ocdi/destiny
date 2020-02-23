import chalk from "chalk";
import { cosmiconfigSync } from "cosmiconfig";
import { existsSync, lstatSync, readdirSync } from "fs-extra";

import getFilePaths from "./index/getFilePaths";
import logger from "./shared/logger";
import { formatFileStructure } from "./index/formatFileStructure";
import { version } from "../package.json";

const { argv } = process;

export type Options = {
  help: boolean;
  version: boolean;
};

const defaultOptions: Options = {
  help: false,
  version: false,
};

const printVersion = () => console.log("v" + version);
const printHelp = (exitCode: number) => {
  console.log(
    chalk`{blue destiny} - Prettier for file structures.

{bold USAGE}

  {blue destiny} [option...] [{underline path}]

  The {underline path} argument can consist of either a {bold file path} or a {bold glob}.

{bold OPTIONS}

  -V, --version            output version number
  -h, --help               output usage information
  -e, --entrypoint         explicit entrypoint
  `
  );

  return process.exit(exitCode);
};

const parseArgs = (
  args: any[]
): { options: Partial<Options>; paths: string[]; entries: string[] } => {
  let entry = false;
  return args.reduce(
    (acc, arg) => {
      if (entry) {
        entry = false;
        acc.entries.push(arg);
        return acc;
      }

      switch (arg) {
        case "-h":
        case "--help":
          acc.options.help = true;
          break;
        case "-V":
        case "--version":
          acc.options.version = true;
          break;
        case "-e":
        case "--entrypoint":
          entry = true;
          break;
        default:
          acc.paths.push(arg);
      }

      return acc;
    },
    { options: {}, paths: [], entries: [] }
  );
};
export const run = async (args: string[]) => {
  const config: Partial<Options> =
    cosmiconfigSync("destiny").search()?.config ?? {};
  const { options, paths, entries } = parseArgs(args);

  const mergedOptions: Options = {
    ...defaultOptions,
    ...config,
    ...options,
  };

  if (mergedOptions.help) return printHelp(0);
  if (mergedOptions.version) return printVersion();
  if (paths.length === 0) return printHelp(1);

  logger.info("Resolving files.");

  const filesToRestructure = getFilePaths(paths, mergedOptions);
  const filesToEdit = filesToRestructure.flat();

  if (filesToRestructure.length === 0) {
    logger.error("Could not find any files to restructure", 1);
    return;
  }

  await formatFileStructure(filesToRestructure, filesToEdit, entries);
};

if (process.env.NODE_ENV !== "test") {
  run(argv.slice(2, argv.length));
}
