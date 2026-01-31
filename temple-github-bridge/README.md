# Temple GitHub Bridge

Secure, localhost-only bridge to let Claude read approved files from Temple repositories via VS Code.

Features
- Localhost REST API with health/status
- Human approval prompts (read-only)
- Allowed path restrictions
- Request logging in VS Code output channel

Commands
- Temple Bridge: Start Server
- Temple Bridge: Stop Server
- Temple Bridge: Show Status

Configuration
- templeBridge.port (default 3737)
- templeBridge.autoApprove (default false)
- templeBridge.allowedPaths (["/temple-protocols/", "/living-dashboard/", "/council-governance/"])

Install
 - Open VS Code Command Palette: Developer: Install Extension from Location
 - Select the folder c:\Temple\temple-github-bridge
 - Run `npm install` inside the folder if prompted for dependencies
