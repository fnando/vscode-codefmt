import * as vscode from "vscode";
import * as path from "path";
import { existsSync } from "fs";
import { spawnSync } from "child_process";

import * as _settings from "./codefmt.json";
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

  debug("current dir:", process.cwd());
  debug("root dir:", rootDir);
  debug("file:", document.fileName);
  debug("language:", document.languageId);

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
  const formatters: Formatters = {
    ..._settings.formatters,
    ...config().formatters,
  };

  return config()
    .preferredFormatters.map((formatter) => formatters[formatter])
    .filter(Boolean)
    .filter((formatter) => formatter.languages.includes(languageId));
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
  const started = Date.now();
  const { fileName } = document;

  const formatterName = formatter.command[0];

  log("\n---------------------------------------------------------\n");

  debug("formatting", fileName, "with", formatterName);

  const configFile = findConfigFile(rootDir, formatter);

  if (!configFile) {
    debug(formatterName, "doesn't have a config file.");
  }

  const [command, ...args] = expandArgs(formatter.command, {
    $config: configFile,
    $file: fileName,
    $debug: config().debug ? formatter.debug : null,
  });

  debug("config file:", configFile);
  debug("command:", command, args);

  const response = spawnSync(command, args, { cwd: rootDir, env: process.env });
  const stdout = response.stdout.toString().trim();
  const stderr = response.stderr.toString().trim();

  if (stdout) {
    debug("stdout:\n", stdout, "\n");
  }

  if (stderr) {
    debug("stderr:\n", stderr, "\n");
  }

  debug(formatterName, `command finished with exit ${response.status}`);

  if (response.status !== 0) {
    debug(
      "some commands exit with nonzero status to indicate that there are issues that couldn't be automatically fixed.",
    );
  }
}

function expandArgs(command: string[], args: { [key: string]: unknown }) {
  command = JSON.parse(JSON.stringify(command));

  Object.keys(args).forEach((key) => {
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
