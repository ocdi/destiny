import path from "path";
import { findEdges } from "./shared/findEdges";
import { addEdge } from "./buildGraph/addEdge";
import { Graph, OldGraph } from "./shared/Graph";
import { findSharedParent } from "./shared/findSharedParent";
import { customResolve } from "./shared/customResolve";
import logger from "../../shared/logger";

export function buildGraph(files: string[]) {
  const parentFolder = findSharedParent(files);
  const graph: Graph = {};
  const oldGraph: OldGraph = {};
  const totalFiles: string[] = [];
  let numForwardSlashes = 0;
  let numBackSlashes = 0;
  for (let file of files) {
    if (file === ".git") {
      continue;
    }
    file = path.resolve(file);
    const start = path.relative(parentFolder, file);
    if (!(start in oldGraph)) {
      oldGraph[start] = {
        oldLocation: file,
        imports: [],
      };
    }
    totalFiles.push(start);
    findEdges(file).forEach(edge => {
      if (edge[1].includes("/")) {
        numForwardSlashes++;
      } else if (edge[1].includes("\\")) {
        numBackSlashes++;
      }

      try {
        const pathWithExtension = customResolve(edge[1], path.dirname(edge[0]));
        const end = path.relative(parentFolder, pathWithExtension);

        addEdge([start, end], graph);

        oldGraph[start].imports.push({
          text: edge[1],
          resolved: end,
        });
      } catch (e) {
        logger.warn(`Unable to import ${edge[1]}`);
      }
    });
  }

  return {
    parentFolder,
    graph,
    files: totalFiles,
    oldGraph,
    useForwardSlash: numForwardSlashes >= numBackSlashes ? true : false,
  };
}
