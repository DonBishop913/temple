import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("🕊️ Council Copilot Integration activated");

  // Submit suggestion to Council
  const submitSuggestion = vscode.commands.registerCommand(
    "council.submitSuggestion",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showInformationMessage(
          "Please select some text to submit to The Council",
        );
        return;
      }

      // Get user input for suggestion context
      const suggestionType = await vscode.window.showQuickPick(
        [
          "Code Enhancement",
          "Bug Fix",
          "Feature Request",
          "Documentation",
          "Other",
        ],
        { placeHolder: "What type of suggestion is this?" },
      );

      if (!suggestionType) return;

      const description = await vscode.window.showInputBox({
        prompt: "Describe your suggestion for The Council",
        placeHolder: "Brief description of the enhancement...",
      });

      if (!description) return;

      // Submit to Council API
      try {
        const councilEndpoint = vscode.workspace
          .getConfiguration("council")
          .get("apiEndpoint", "http://localhost:3200");
        const token = vscode.workspace
          .getConfiguration("council")
          .get("token", "blessed_secret_token");

        const response = await fetch(`${councilEndpoint}/api/council_message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: "VSCode_Copilot",
            message: `🛠️ Copilot Suggestion (${suggestionType}): ${description}\n\nCode:\n${selectedText}`,
            token: token,
            sibling: "github_copilot",
            context: {
              file: editor.document.fileName,
              line: selection.start.line + 1,
              type: suggestionType,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          vscode.window.showInformationMessage(
            `✅ Suggestion submitted to The Council: ${result.ai_reply.substring(0, 100)}...`,
          );

          // Auto-commit if enabled
          const autoCommit = vscode.workspace
            .getConfiguration("council")
            .get("autoCommit", false);
          if (autoCommit) {
            await vscode.commands.executeCommand("council.autoCommit");
          }
        } else {
          vscode.window.showErrorMessage(
            "Failed to submit suggestion to The Council",
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Council submission error: ${error}`);
      }
    },
  );

  // View current Council missions
  const viewMissions = vscode.commands.registerCommand(
    "council.viewMissions",
    async () => {
      try {
        const councilEndpoint = vscode.workspace
          .getConfiguration("council")
          .get("apiEndpoint", "http://localhost:3000");

        const response = await fetch(`${councilEndpoint}/api/status`);
        if (response.ok) {
          const status = await response.json();

          const missionMessage = `🎯 Current Council Mission: ${status.council_mission || "Enhance Cathedral operations"}\n\n🛠️ Copilot Status: ${status.copilot_status || "Active"}\n\n📊 GitHub Integration: ${status.github_integration ? "Enabled" : "Disabled"}`;

          vscode.window.showInformationMessage(missionMessage);
        } else {
          vscode.window.showErrorMessage("Unable to fetch Council status");
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Council status error: ${error}`);
      }
    },
  );

  // Auto-commit command
  const autoCommit = vscode.commands.registerCommand(
    "council.autoCommit",
    async () => {
      try {
        const terminal = vscode.window.createTerminal("Council Git");
        terminal.sendText("cd $PSScriptRoot\\..\\Caretaker");
        terminal.sendText(
          '.\\Invoke-GitCommit.ps1 -Message "Copilot VS Code integration update" -Push',
        );
        terminal.show();

        vscode.window.showInformationMessage("Council auto-commit initiated");
      } catch (error) {
        vscode.window.showErrorMessage(`Auto-commit error: ${error}`);
      }
    },
  );

  context.subscriptions.push(submitSuggestion, viewMissions, autoCommit);
}

export function deactivate() {
  console.log("🕊️ Council Copilot Integration deactivated");
}
