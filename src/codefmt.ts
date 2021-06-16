import * as vscode from "vscode";
import * as path from "path";
import { existsSync } from "fs";
import { spawnSync } from "child_process";

import * as settings from "./codefmt.json";
import "./config/eslint.json";
import "./config/prettier.json";

let output: vscode.OutputChannel = vscode.window.createOutputChannel("codefmt");

interface Config extends vscode.WorkspaceConfiguration {
  enableOnSave: boolean;
  debug: boolean;
}

interface Formatter {
  command: string[];
  languages: string[];
  debug: string[];
  defaultConfig: null | string;
  configFiles: string[];
}

function sleep(delay:number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function debug(...args: any[]) {
  if (!config().debug) {
    return;
  }

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

  output.appendLine(`[codefmt] ${args.join(" ")}`);
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

  if (onSave) {
    if (!config().enableOnSave) {
      debug("Codefmt on Save is disabled");
      return;
    }
  }

  if (config().debug) {
    output.clear();
    output.show(true);
  }

  debug("file:", document.fileName);
  debug("language:", document.languageId);

  const formatters = findFormatters(document.languageId);

  debug("formatters that will be applied:", formatters);

  for (const formatter of formatters) {
    const formatterName = formatter.command[0];
    statusBarItem.text = `$(run-all) ${formatterName}`;

    try {
      await run(document, formatter);
    } catch (error) {
      // noop
    }
  }

  await sleep(500);
  statusBarItem.text = "";
}

function findFormatters(languageId: string): Formatter[] {
  debug("enabled formatters:", settings.formatters);

  return settings.formatters
    .map(
      (formatter) =>
        (settings as unknown as { [key: string]: Formatter })[formatter],
    )
    .filter((formatter) => formatter.languages.includes(languageId));
}

function run(document: vscode.TextDocument, formatter: Formatter) {
  const started = Date.now();
  const { fileName } = document;
  const dirs = vscode.workspace.workspaceFolders?.map(
    (folder) => folder.uri.path,
  ) ?? [path.dirname(fileName)];
  const formatterName = formatter.command[0];

  debug("current dir:", process.cwd());
  debug("formatting", fileName, "with", formatterName);
  debug("dirs:", dirs);

  const rootDir = findRootDir(dirs, fileName);
  const configFile = findConfigFile(rootDir, formatter);

  if (!configFile) {
    debug(formatterName, "doesn't have a config file, so skipping.");
  }

  const [command, ...args] = expandArgs(formatter.command, {
    $config: configFile,
    $file: fileName,
    $debug: config().debug ? formatter.debug : null,
  });

  debug("root dir:", rootDir);
  debug("config file:", configFile);
  debug("command:", command, args);

  const which = spawnSync("which", [formatterName]);

  if (which.status !== 0) {
    debug(
      "couldn't find",
      formatterName,
      "within",
      `PATH="${process.env.PATH}"`,
    );

    return;
  }

  debug("using", which.stdout.toString());

  const response = spawnSync(command, args, { cwd: rootDir, env: process.env });

  debug("stdout:\n", response.stdout.toString(), "\n");
  debug("stderr:\n", response.stderr.toString(), "\n");
  debug(formatterName, "command finished with exit", response.status);

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
      command.splice(command.indexOf(key) - 1, 2);
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
