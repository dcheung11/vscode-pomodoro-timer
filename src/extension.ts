import * as vscode from "vscode";
import * as path from "path";

let pomodoroStatusItem: vscode.StatusBarItem | undefined;
let pomodoroInterval: NodeJS.Timeout | undefined;
let pomodoroDurationSeconds = 10; // 10 seconds for testing
let isWorkSession = false; // Track if it's a work session

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "show-ext" is now active!');
  pomodoroStatusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  pomodoroStatusItem.text = "Pomodoro: LOCK IN";
  pomodoroStatusItem.tooltip = "Pomodoro Timer Status";
  pomodoroStatusItem.command = "show-ext.startPomodoro";
  pomodoroStatusItem.show();

  let disposable = vscode.commands.registerCommand(
    "show-ext.startPomodoro",
    () => {
      vscode.window.showInformationMessage("Pomodoro Ext ON!");
      if (!isWorkSession) {
        startPomodoroTimer(context);
      } else {
        startBreak(context);
      }
    }
  );

  context.subscriptions.push(disposable);

  let disposableStop = vscode.commands.registerCommand(
    "show-ext.stopPomodoro",
    () => {
      stopPomodoroTimer(context);
    }
  );
  context.subscriptions.push(disposableStop);
}

function startPomodoroTimer(context: vscode.ExtensionContext) {
  isWorkSession = true;
  pomodoroStatusItem!.text = "Pomodoro: Work";
  pomodoroStatusItem!.tooltip = "Pomodoro Timer is running";

  // Reset the cursor style to the default
  const editorConfig = vscode.workspace.getConfiguration("editor");
  editorConfig.update("cursorStyle", vscode.TextEditorCursorStyle.Line);

  pomodoroDurationSeconds = 2; // 25 minutes work duration
  updateStatusText();

  pomodoroInterval = setInterval(() => {
    pomodoroDurationSeconds--;
    updateStatusText();

    if (pomodoroDurationSeconds <= 0) {
      clearInterval(pomodoroInterval!);
      vscode.window.showInformationMessage(
        "Work session completed. It's time for a break!"
      );

      startBreak(context);
    }
  }, 1000); // Update every second
}

function startBreak(context: vscode.ExtensionContext) {
  isWorkSession = false;
  pomodoroStatusItem!.text = "Pomodoro: Break";
  pomodoroStatusItem!.tooltip = "Pomodoro Timer is running";

  // Add a decoration with a tomato image
  const tomatoImageUri = vscode.Uri.file(
    path.join(context.extensionPath, "tomato.png")
  );
  const tomatoDecorationType = vscode.window.createTextEditorDecorationType({
    gutterIconPath: tomatoImageUri,
	gutterIconSize: 'cover',
	backgroundColor: "transparent",

    // width: "20px", // Adjust the width to your image size
    // height: "20px", // Adjust the height to your image size
  });

  // Apply the decoration to the active editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const line = activeEditor.document.lineAt(0); // Change the line number as needed
    const range = new vscode.Range(line.range.start, line.range.start);
    activeEditor.setDecorations(tomatoDecorationType, [range]);
  }

  pomodoroDurationSeconds = 5 * 1; // 5 minutes break duration
  updateStatusText();

  pomodoroInterval = setInterval(() => {
    pomodoroDurationSeconds--;
    updateStatusText();

    if (pomodoroDurationSeconds <= 0) {
      clearInterval(pomodoroInterval!);
      vscode.window.showInformationMessage("Break time's up! Back to work.");

      // Clear the decoration
      if (activeEditor) {
        activeEditor.setDecorations(tomatoDecorationType, []);
      }

      startPomodoroTimer(context);
    }
  }, 1000); // Update every second
}

function stopPomodoroTimer(context: vscode.ExtensionContext) {
  isWorkSession = false;
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
  }

  pomodoroStatusItem!.text = "Pomodoro: Stopped";
  pomodoroStatusItem!.tooltip = "Pomodoro Timer has stopped";

  // Reset the cursor style to the default
  const editorConfig = vscode.workspace.getConfiguration("editor");
  editorConfig.update("cursorStyle", vscode.TextEditorCursorStyle.Line);
}

function updateStatusText() {
  const minutes = Math.floor(pomodoroDurationSeconds / 60);
  const seconds = pomodoroDurationSeconds % 60;
  pomodoroStatusItem!.text = `Pomodoro: ${minutes}m ${seconds}s`;
}

export function deactivate() {}
