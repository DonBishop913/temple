const vscode = require('vscode');
const { startAPIServer, stopAPIServer, getServerStatus } = require('./api-server');

let serverInstance = null;
let outputChannel = null;

function activate(context) {
    outputChannel = vscode.window.createOutputChannel('Temple GitHub Bridge');
    outputChannel.appendLine('Temple GitHub Bridge activated');

    const startCommand = vscode.commands.registerCommand('temple-bridge.start', async () => {
        if (serverInstance) {
            vscode.window.showWarningMessage('Temple Bridge server is already running');
            return;
        }
        const config = vscode.workspace.getConfiguration('templeBridge');
        const port = config.get('port');
        try {
            serverInstance = await startAPIServer(port, context.extensionPath, outputChannel);
            vscode.window.showInformationMessage(`Temple Bridge server started on port ${port}`);
            outputChannel.appendLine(`✓ Server started on http://localhost:${port}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start Temple Bridge: ${error.message}`);
            outputChannel.appendLine(`✗ Error: ${error.message}`);
        }
    });

    const stopCommand = vscode.commands.registerCommand('temple-bridge.stop', () => {
        if (!serverInstance) {
            vscode.window.showWarningMessage('Temple Bridge server is not running');
            return;
        }
        stopAPIServer();
        serverInstance = null;
        vscode.window.showInformationMessage('Temple Bridge server stopped');
        outputChannel.appendLine('✓ Server stopped');
    });

    const statusCommand = vscode.commands.registerCommand('temple-bridge.status', () => {
        const status = getServerStatus();
        const config = vscode.workspace.getConfiguration('templeBridge');
        const message = `Temple GitHub Bridge\nServer: ${status.running ? '✓ Running' : '✗ Stopped'}\nPort: ${config.get('port')}\nAuto-approve: ${config.get('autoApprove') ? '⚠ Enabled' : '✓ Disabled'}\nRequests handled: ${status.requestCount}\nLast request: ${status.lastRequest || 'None'}`;
        vscode.window.showInformationMessage(message, { modal: true });
        outputChannel.show();
        outputChannel.appendLine(message);
    });

    context.subscriptions.push(startCommand, stopCommand, statusCommand);
}

function deactivate() {
    if (serverInstance) { stopAPIServer(); }
    if (outputChannel) { outputChannel.dispose(); }
}

module.exports = { activate, deactivate };
