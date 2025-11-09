# IPFS to Helia Migration Guide

## Overview
The Temple codebase currently uses the deprecated `ipfs-http-client` library, which contains 3 high-severity vulnerabilities in the `parse-duration` dependency. This guide outlines the migration to Helia, the modern, secure IPFS implementation.

## Current Vulnerabilities
- **parse-duration** (GHSA-hcrg-fc28-fcg5): Regex Denial of Service vulnerability
- **Affected Package**: ipfs-http-client <=50.1.2
- **Risk Level**: High - Event loop delay and out-of-memory conditions possible

## Migration Plan

### Phase 1: Preparation (Current)
- ✅ Created `heliaService.js` as Helia-compatible replacement
- ✅ Updated `package.json` with Helia dependencies
- ✅ Documented security risks and acceptable usage limitations

### Phase 2: Migration (Post-Harvest)
1. **Install Helia Dependencies**
   ```bash
   npm uninstall ipfs-http-client
   npm install helia @helia/unixfs
   ```

2. **Update Service Imports**
   ```javascript
   // OLD: const ipfsService = require("./services/ipfsService");
   const ipfsService = require("./services/heliaService");
   ```

3. **Update Service Calls**
   - `heliaService.snapshotAndArchive()` maintains same API
   - No breaking changes to calling code required

4. **Test Migration**
   - Run existing IPFS archive functionality
   - Verify CID generation and log entries
   - Test error handling and graceful shutdown

### Phase 3: Cleanup
- Remove deprecated `ipfsService.js`
- Update documentation
- Run security audit to confirm vulnerabilities resolved

## Security Benefits
- **Zero Known Vulnerabilities**: Helia is actively maintained and secure
- **Modern Architecture**: Built on libp2p and modern JavaScript patterns
- **Better Performance**: More efficient than legacy ipfs-http-client

## Risk Mitigation (Current)
Until migration is complete:
- IPFS usage is limited to internal ledger archiving
- No public/untrusted data passes through vulnerable code paths
- Archive operations are monitored and logged
- Security scans run regularly

## Timeline
- **Immediate**: Continue with documented risk acceptance
- **Post-Harvest**: Complete Helia migration within 2 weeks
- **Ongoing**: Regular security audits and dependency updates

## Council Review Required
This migration affects core archival functionality. Council approval required before Phase 2 implementation.