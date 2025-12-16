const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const vscode = require('vscode');

let app = null;
let server = null;
let requestLog = [];

const serverStats = { running: false, requestCount: 0, lastRequest: null };

function startAPIServer(port, extensionPath, outputChannel) {
  return new Promise((resolve, reject) => {
    app = express();
    app.use(cors());
    app.use(express.json());

    const config = vscode.workspace.getConfiguration('templeBridge');
    const allowedPaths = config.get('allowedPaths');
    const autoApprove = config.get('autoApprove');

    // Logging middleware
    app.use((req, res, next) => {
      const logEntry = { timestamp: new Date().toISOString(), method: req.method, path: req.path, query: req.query, ip: req.ip };
      requestLog.push(logEntry);
      serverStats.requestCount++;
      serverStats.lastRequest = logEntry.timestamp;
      outputChannel.appendLine(`[${logEntry.timestamp}] ${req.method} ${req.path}`);
      next();
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'operational', service: 'Temple GitHub Bridge', timestamp: new Date().toISOString(), requests: serverStats.requestCount });
    });

    app.get('/api/repositories', async (req, res) => {
      try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) { return res.status(404).json({ error: 'No workspace folders open' }); }
        const repos = workspaceFolders.map(folder => ({ name: folder.name, path: folder.uri.fsPath }));
        res.json({ repositories: repos });
      } catch (error) {
        outputChannel.appendLine(`✗ Error listing repos: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/file', async (req, res) => {
      const { repo, path: filePath } = req.query;
      if (!repo || !filePath) { return res.status(400).json({ error: 'Missing repo or path parameter' }); }
      const isAllowed = allowedPaths.some(allowed => filePath.startsWith(allowed));
      if (!isAllowed) { outputChannel.appendLine(`✗ Access denied: ${filePath} not in allowed paths`); return res.status(403).json({ error: 'Path not allowed', allowedPaths }); }
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.find(f => f.name === repo);
        if (!workspaceFolder) { return res.status(404).json({ error: 'Repository not found' }); }
        const fullPath = path.join(workspaceFolder.uri.fsPath, filePath);
        if (!autoApprove) {
          const choice = await vscode.window.showInformationMessage(`Claude requests access to: ${filePath} in ${repo}`, { modal: true }, 'Approve', 'Deny');
          if (choice !== 'Approve') { outputChannel.appendLine(`✗ Access denied by user: ${filePath}`); return res.status(403).json({ error: 'Access denied by user' }); }
          outputChannel.appendLine(`✓ Access approved: ${filePath}`);
        }
        const content = await fs.readFile(fullPath, 'utf-8');
        outputChannel.appendLine(`✓ File sent: ${filePath} (${content.length} bytes)`);
        res.json({ repo, path: filePath, content, size: content.length, timestamp: new Date().toISOString() });
      } catch (error) {
        outputChannel.appendLine(`✗ Error reading file: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/list', async (req, res) => {
      const { repo, path: dirPath } = req.query;
      if (!repo) { return res.status(400).json({ error: 'Missing repo parameter' }); }
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.find(f => f.name === repo);
        if (!workspaceFolder) { return res.status(404).json({ error: 'Repository not found' }); }
        const fullPath = dirPath ? path.join(workspaceFolder.uri.fsPath, dirPath) : workspaceFolder.uri.fsPath;
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const contents = items.map(item => ({ name: item.name, type: item.isDirectory() ? 'directory' : 'file', path: dirPath ? path.join(dirPath, item.name) : item.name }));
        res.json({ contents });
      } catch (error) {
        outputChannel.appendLine(`✗ Error listing directory: ${error.message}`);
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/logs', (req, res) => { res.json({ logs: requestLog.slice(-100) }); });

    server = app.listen(port, 'localhost', () => {
      serverStats.running = true;
      outputChannel.appendLine(`✓ Temple GitHub Bridge listening on http://localhost:${port}`);
      outputChannel.appendLine(`✓ Auto-approve: ${autoApprove ? '⚠ ENABLED' : '✓ DISABLED'}`);
      outputChannel.appendLine(`✓ Allowed paths: ${allowedPaths.join(', ')}`);
      resolve(server);
    });
    server.on('error', (error) => { serverStats.running = false; outputChannel.appendLine(`✗ Server error: ${error.message}`); reject(error); });
  });
}

function stopAPIServer() { if (server) { server.close(); serverStats.running = false; server = null; app = null; } }
function getServerStatus() { return { ...serverStats }; }

module.exports = { startAPIServer, stopAPIServer, getServerStatus };
