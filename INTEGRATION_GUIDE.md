# Model Startup Configuration Integration Guide

## Overview

This branch implements startup-time model selection for OpenChamber, allowing users to specify which AI model and variant to use when starting the server.

## Files Created/Modified

### 1. **CLI Options Parser** (`packages/web/server/lib/opencode/cli-options.js`)
- **Status**: Modified ✅
- **Changes**:
  - Added `--model <provider/model>` or `-m <provider/model>` option parsing
  - Added `--variant <variant>` option parsing
  - Falls back to environment variables: `OPENCHAMBER_DEFAULT_MODEL` and `OPENCHAMBER_DEFAULT_VARIANT`
  - Exports `defaultModel` and `defaultVariant` in parsed options object

**Usage**:
```bash
# Set model via CLI
openchamber-server --model anthropic/claude-3-opus --variant xhigh

# Or use environment variables
export OPENCHAMBER_DEFAULT_MODEL="anthropic/claude-3-opus"
export OPENCHAMBER_DEFAULT_VARIANT="xhigh"
```

### 2. **CLI Entry Point** (`packages/web/server/lib/opencode/cli-entry-runtime.js`)
- **Status**: Modified ✅
- **Changes**:
  - Updated to pass `defaultModel` and `defaultVariant` from parsed options to `main()` function

### 3. **Model Startup Runtime** (`packages/web/server/lib/opencode/model-startup-runtime.js`)
- **Status**: Created ✅
- **Exports**:
  - `createModelStartupRuntime()` - Factory function
  - `mergeModelSettings(persistedSettings, defaultModel, defaultVariant)` - Merges CLI args with persisted settings (CLI takes precedence)
  - `logModelConfiguration(settings)` - Logs model configuration for debugging
  - `validateModelRef(modelRef)` - Validates model reference format (provider/model)
  - `normalizeVariant(variant)` - Normalizes variant string

**Behavior**:
- CLI arguments override environment variables
- Merged settings override persisted settings
- Provides validation and normalization of model references
- Includes logging for startup debugging

### 4. **Integration Helper** (`packages/web/server/lib/opencode/model-startup-integration.js`)
- **Status**: Created ✅
- **Exports**:
  - `applyModelStartupConfiguration(options)` - Integrates model config into main server

**Usage in main() function**:
```javascript
import { applyModelStartupConfiguration } from './lib/opencode/model-startup-integration.js';
import { createModelStartupRuntime } from './lib/opencode/model-startup-runtime.js';

async function main(options = {}) {
  const modelStartupRuntime = createModelStartupRuntime();
  
  // ... after feature routes are registered ...
  
  await applyModelStartupConfiguration({
    options,
    readSettingsFromDiskMigrated,
    persistSettings,
    modelStartupRuntime,
  });
  
  // ... rest of initialization ...
}
```

### 5. **Main Server** (`packages/web/server/index.js`)
- **Status**: Partially updated ⚠️
- **Required Changes**:
  - Import `createModelStartupRuntime` at line 62
  - Call `applyModelStartupConfiguration()` after `featureRoutesRuntime.registerRoutes()` completes (around line 1920)
  - This ensures model configuration is applied before UI initialization

**Integration Point** (insert after line 1917):
```javascript
// Apply model configuration from CLI startup arguments
const modelStartupRuntime = createModelStartupRuntime();
await applyModelStartupConfiguration({
  options,
  readSettingsFromDiskMigrated,
  persistSettings,
  modelStartupRuntime,
});
```

## Architecture & Flow

```
CLI Arguments
    ↓
parseServeCliOptions (cli-options.js)
    ↓ (extracts --model and --variant)
    ↓
main(options) in index.js
    ↓
createModelStartupRuntime()
    ↓
applyModelStartupConfiguration()
    ↓
mergeModelSettings()
    ├─ Reads persisted settings
    ├─ Validates model reference
    ├─ Normalizes variant
    └─ Merges: CLI > Persisted
        ↓
persistSettings() → saved to disk
    ↓
logModelConfiguration() → console output
    ↓
Server starts with selected model
```

## Precedence Order

1. **CLI Arguments** (highest priority)
   - `--model provider/model`
   - `--variant xhigh`

2. **Environment Variables**
   - `OPENCHAMBER_DEFAULT_MODEL`
   - `OPENCHAMBER_DEFAULT_VARIANT`

3. **Persisted Settings** (lowest priority)
   - Loaded from `~/.config/openchamber/settings.json`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `OPENCHAMBER_DEFAULT_MODEL` | Default model on startup | `anthropic/claude-3-opus` |
| `OPENCHAMBER_DEFAULT_VARIANT` | Model variant on startup | `xhigh` |

## Testing Checklist

- [ ] Test CLI parsing with `--model` and `--variant`
- [ ] Test short form `-m` for model
- [ ] Test environment variable fallback
- [ ] Test merging with existing persisted settings
- [ ] Verify settings are persisted after startup
- [ ] Check console logs for model configuration
- [ ] Test invalid model reference handling
- [ ] Verify precedence: CLI > Env > Persisted

## Next Steps for Complete Integration

1. **Update index.js** to call `applyModelStartupConfiguration()`
   - Import `createModelStartupRuntime` 
   - Import `applyModelStartupConfiguration`
   - Call after feature routes registration

2. **Add UI controls** to change model at runtime (optional)
   - Leverage existing settings UI
   - Persist changes for next startup

3. **Add telemetry/logging** (optional)
   - Track which models are being selected
   - Monitor model startup performance

4. **Documentation** (optional)
   - Update README with model selection examples
   - Add troubleshooting guide

## Related Source Code Links

- [CLI Options Parser](https://github.com/rpgoldman/openchamber/blob/feature/startup-model-selection/packages/web/server/lib/opencode/cli-options.js)
- [Model Startup Runtime](https://github.com/rpgoldman/openchamber/blob/feature/startup-model-selection/packages/web/server/lib/opencode/model-startup-runtime.js)
- [Integration Helper](https://github.com/rpgoldman/openchamber/blob/feature/startup-model-selection/packages/web/server/lib/opencode/model-startup-integration.js)
- [CLI Entry Point](https://github.com/rpgoldman/openchamber/blob/feature/startup-model-selection/packages/web/server/lib/opencode/cli-entry-runtime.js)

## Branch Information

- **Base**: `5eb0bb916e6540437b649d1cdb3b70c89113de5f` (before modifications)
- **Branch**: `feature/startup-model-selection`
- **Repository**: `rpgoldman/openchamber`

## Example Usage After Integration

```bash
# Start with specific model
openchamber-server --model anthropic/claude-3-opus --variant xhigh --port 3000

# Using environment variables
export OPENCHAMBER_DEFAULT_MODEL="anthropic/claude-3-sonnet"
export OPENCHAMBER_DEFAULT_VARIANT="default"
openchamber-server

# Mixed: CLI overrides environment
export OPENCHAMBER_DEFAULT_MODEL="old-model"
openchamber-server --model anthropic/claude-3-opus  # Uses claude-3-opus
```
