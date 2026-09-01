/**
 * Integration helper for applying model startup configuration in the main server function.
 * Call this after featureRoutesRuntime.registerRoutes() but before returning from main().
 */
export const applyModelStartupConfiguration = async ({
  options,
  readSettingsFromDiskMigrated,
  persistSettings,
  modelStartupRuntime,
}) => {
  if (!options?.defaultModel && !options?.defaultVariant) {
    // No CLI model arguments provided; just log current config
    const persistedSettings = await readSettingsFromDiskMigrated().catch(() => ({}));
    modelStartupRuntime.logModelConfiguration(persistedSettings);
    return;
  }

  // Merge persisted settings with CLI-provided model defaults
  const persistedSettings = await readSettingsFromDiskMigrated().catch(() => ({}));
  const mergedSettings = modelStartupRuntime.mergeModelSettings(
    persistedSettings,
    options.defaultModel,
    options.defaultVariant
  );

  // Persist the merged settings if CLI model was provided
  try {
    await persistSettings(mergedSettings);
    modelStartupRuntime.logModelConfiguration(mergedSettings);
  } catch (error) {
    console.warn(
      '[model-startup] Failed to persist model settings:',
      error?.message || error
    );
    // Continue anyway; model selection can happen at runtime
    modelStartupRuntime.logModelConfiguration(mergedSettings);
  }
};
