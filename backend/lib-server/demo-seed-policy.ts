export function shouldAutoSeedDemoData(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" && env.ALLOW_DEMO_SEED === "true";
}
