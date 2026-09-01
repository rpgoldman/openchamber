/**
 * Handles startup-time model configuration for OpenChamber.
 * Merges CLI arguments with persisted settings, giving priority to CLI args.
 */
export const createModelStartupRuntime = () => {
  /**
   * Validate and normalize model identifier in "provider/model" format.
   * @param {string} modelId - Model identifier like "anthropic/claude-opus"
   * @returns {Object|null} { providerId, modelId } or null if invalid
   */
  const parseModelIdentifier = (modelId) => {
    if (typeof modelId !== 'string' || !modelId.trim()) {
      return null;
    }

    const normalized = modelId.trim();
    const parts = normalized.split('/');

    if (parts.length !== 2) {
      console.warn(
        `[model-startup] Invalid model format: "${normalized}". Expected "provider/model", skipping.`
      );
      return null;
    }

    const [providerId, model] = parts;
    if (!providerId.trim() || !model.trim()) {
      console.warn(
        `[model-startup] Invalid model format: "${normalized}". Provider and model cannot be empty, skipping.`
      );
      return null;
    }

    return {
      providerId: providerId.toLowerCase().trim(),
      modelId: model.trim(),
    };
  };

  /**
   * Validate variant string (e.g., "thinking", "reasoning", "xhigh")
   */
  const normalizeVariant = (variant) => {
    if (typeof variant !== 'string') return undefined;
    const trimmed = variant.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  /**
   * Merges CLI-provided model settings with persisted settings.
   * CLI arguments take precedence.
   */
  const mergeModelSettings = (
    persistedSettings,
    cliDefaultModel,
    cliDefaultVariant
  ) => {
    const merged = {
      ...persistedSettings,
    };

    // Apply CLI model if provided
    if (typeof cliDefaultModel === 'string' && cliDefaultModel.trim()) {
      const parsed = parseModelIdentifier(cliDefaultModel);
      if (parsed) {
        merged.defaultModel = `${parsed.providerId}/${parsed.modelId}`;
        console.log(
          `[model-startup] Applied CLI model: ${merged.defaultModel}`
        );
      }
    }

    // Apply CLI variant if provided
    if (typeof cliDefaultVariant === 'string' && cliDefaultVariant.trim()) {
      const normalized = normalizeVariant(cliDefaultVariant);
      if (normalized) {
        merged.defaultVariant = normalized;
        console.log(
          `[model-startup] Applied CLI variant: ${merged.defaultVariant}`
        );
      }
    }

    return merged;
  };

  /**
   * Logs startup model configuration for debugging
   */
  const logModelConfiguration = (settings) => {
    if (settings.defaultModel) {
      console.log(
        `[model-startup] Default model: ${settings.defaultModel}${
          settings.defaultVariant ? ` (${settings.defaultVariant})` : ''
        }`
      );
    } else {
      console.log(
        '[model-startup] No default model configured; user will select at runtime'
      );
    }
  };

  return {
    parseModelIdentifier,
    normalizeVariant,
    mergeModelSettings,
    logModelConfiguration,
  };
};
