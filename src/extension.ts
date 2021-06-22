import * as vscode from "vscode";
import * as codefmt from "./codefmt";

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  codefmt.debug(
    "settings:",
    JSON.stringify(vscode.workspace.getConfiguration("codefmt"), null, 2),
  );

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    10_000,
  );
  statusBarItem.show();

  context.subscriptions.push(
    statusBarItem,

    vscode.commands.registerCommand("codefmt.run", () => {
      if (vscode.window.activeTextEditor?.document) {
        codefmt.formatDebounced({
          document: vscode.window.activeTextEditor.document,
          statusBarItem,
          onSave: false,
        });
      }
    }),

    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      codefmt.formatDebounced({ document, statusBarItem, onSave: true });
    }),

    vscode.workspace.onWillSaveTextDocument(
      ({ document }: vscode.TextDocumentWillSaveEvent) => {
        codefmt.formatDebounced({ document, statusBarItem, onSave: true });
      },
    ),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
