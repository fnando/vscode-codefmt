import * as vscode from "vscode";
import * as path from "path";
import { existsSync, writeFileSync } from "fs";
import { spawnSync, SpawnSyncReturns } from "child_process";

import * as settings from "./codefmt.json";
import "./config/eslint.json";
import "./config/prettier.json";

let output: vscode.OutputChannel = vscode.window.createOutputChannel("codefmt");

interface Formatters {
  [key: string]: Formatter;
}

interface Config extends vscode.WorkspaceConfiguration {
  enableOnSave: boolean;
  debug: boolean;
  preferredFormatters: string[];
  formatters: Formatters;
}

interface Formatter {
  useStdout: boolean;
  command: string[];
  languages: string[];
  debug: string[];
  configFiles: string[];
}

function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function log(...args: any[]) {
  args = args.map((item) => {
    if (["boolean", "string", "number"].includes(typeof item)) {
      return item.toString();
    }

    if (item === null) {
      return "null";
    }

    if (item === undefined) {
      return "undefined";
    }

    return JSON.stringify(item, null, 2);
  });

  output.appendLine(args.join(" "));
}

export function debug(...args: any) {
  log("[codefmt]", ...args);
}

export function config(): Config {
  return vscode.workspace.getConfiguration("codefmt") as Config;
}

interface FormatParams {
  document: vscode.TextDocument;
  statusBarItem: vscode.StatusBarItem;
  onSave: boolean;
}

export async function format({
  onSave,
  document,
  statusBarItem,
}: FormatParams): Promise<void> {
  statusBarItem.show();
  statusBarItem.text = "";
  output.clear();

  if (onSave) {
    if (!config().enableOnSave) {
      debug("Codefmt on Save is disabled");
      return;
    }
  }

  if (config().debug) {
    output.show(true);
  }

  const dirs = vscode.workspace.workspaceFolders?.map(
    (folder) => folder.uri.path,
  ) ?? [path.dirname(document.fileName)];
  const rootDir = findRootDir(dirs, document.fileName);

  process.chdir(rootDir);

  debug("current dir:", process.cwd());
  debug("root dir:", rootDir);
  debug("file:", document.fileName);
  debug("language:", document.languageId);
  debug(
    "will format files whose language match",
    `^${document.languageId}(-[a-z0-9]+)*$`,
  );

  const formatters = findFormatters(document.languageId);

  debug(
    "formatters that will be applied:",
    formatters.map((formatter) => formatter.command[0]),
  );

  for (const formatter of formatters) {
    const formatterName = formatter.command[0];
    statusBarItem.text = `$(run-all) ${formatterName}`;

    try {
      await run({ document, formatter, rootDir });
    } catch (error) {
      // noop
    }
  }

  await sleep(500);
  statusBarItem.text = "";
}

function findFormatters(languageId: string): Formatter[] {
  const matcher = new RegExp(`^${languageId}(-[a-z0-9])*$`);

  const formatters: Formatters = {
    ...settings.formatters,
    ...config().formatters,
  };

  return config()
    .preferredFormatters.map((formatter) => formatters[formatter])
    .filter(
      (formatter) =>
        formatter &&
        formatter.languages.some((language) => language.match(matcher)),
    );
}

function run({
  document,
  formatter,
  rootDir,
}: {
  document: vscode.TextDocument;
  formatter: Formatter;
  rootDir: string;
}) {
  const { fileName } = document;
  const formatterName = formatter.command[0];
  const quotedFormatterName = JSON.stringify(formatterName);

  log("\n---------------------------------------------------------\n");

  debug("formatting", JSON.stringify(fileName), "with", quotedFormatterName);

  const configFile = findConfigFile(rootDir, formatter);

  if (!configFile) {
    debug("formatter doesn't have a config file.");
  }

  const [command, ...args] = expandArgs(formatter.command, {
    $config: configFile,
    $file: fileName,
    $debug: config().debug ? formatter.debug : null,
  });

  const spawnOptions = { cwd: rootDir, env: process.env };
  let response: SpawnSyncReturns<Buffer>;

  response = spawnSync("which", [command], spawnOptions);

  if (response.status !== 0) {
    debug(
      "The command",
      quotedFormatterName,
      "couldn't be found, so skipping.",
    );
    return;
  }

  debug("config file:", configFile);
  debug("command:", command, args);

  try {
    response = spawnSync(command, args, spawnOptions);
  } catch (error) {
    debug(`error while running formatter:`, error.message);
    return;
  }

  if (response.error) {
    debug("formatter failed to run:", response.error.toString());
    return;
  }

  const stdout = response.stdout.toString().trim();
  const stderr = response.stderr.toString().trim();

  if (formatter.useStdout && response.status === 0) {
    try {
      writeFileSync(fileName, stdout);
    } catch (error) {
      vscode.window.showErrorMessage(
        "Could not save formatted file. Check codefmt output for more details.",
      );
      debug("error:", error.toString());
    }
  }

  if (stdout && !formatter.useStdout) {
    debug("stdout:\n", stdout, "\n");
  }

  if (stderr) {
    debug("stderr:\n", stderr, "\n");
  }

  debug(quotedFormatterName, `command finished with exit ${response.status}`);

  if (response.status !== 0) {
    debug(
      "some commands exit with nonzero status to indicate that there are issues that couldn't be automatically fixed.",
    );
  }
}

function expandArgs(command: string[], args: { [key: string]: unknown }) {
  command = JSON.parse(JSON.stringify(command));

  Object.keys(args).forEach((key) => {
    if (!command.includes(key)) {
      return;
    }

    if (args[key]) {
      // This will be fixed down below by calling flat.
      // @ts-ignore
      command[command.indexOf(key)] = args[key];
    } else {
      if (key === "$config") {
        command.splice(command.indexOf(key) - 1, 2);
      } else {
        command.splice(command.indexOf(key), 1);
      }
    }
  });

  return command.flat().map((item) => String(item).toString());
}

function findConfigFile(rootDir: string, formatter: Formatter) {
  const baseFile = path.join(__dirname, "config", formatter.command[0]);

  const configFiles = [
    ...formatter.configFiles.map((file) => path.join(rootDir, file)),
    `${baseFile}.json`,
    `${baseFile}.yml`,
  ];

  return configFiles.find((file) => existsSync(file));
}

function findRootDir(dirs: string[], fileName: string): string {
  let parts = fileName.split("/").slice(0, -2);

  while (parts.length) {
    const dir = parts.join("/");

    if (dirs.includes(dir)) {
      return dir;
    }

    parts.pop();
  }

  return path.dirname(fileName);
}

export const formatDebounced = (() => {
  let tid: NodeJS.Timeout;

  return (params: FormatParams) => {
    clearTimeout(tid);

    tid = setTimeout(() => format(params), 300);
  };
})();
