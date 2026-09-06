// Every Vercel deployment answers on its own hostname, and Better Auth
// refuses sign-in as cross-origin on any host missing from this list.

type Env = Record<string, string | undefined>;

const LOCAL_ORIGINS = ["http://127.0.0.1:43147", "http://localhost:43147"];

export function trustedOriginsFor(appUrl: string, env: Env = process.env) {
  const production = env.VERCEL_PROJECT_PRODUCTION_URL;
  const deployments = [env.VERCEL_URL, env.VERCEL_BRANCH_URL, production]
    .filter(Boolean)
    .map((host) => `https://${host}`);

  // Per-deployment URLs look like `<project>-<hash>-<scope>.vercel.app`,
  // so no fixed hostname covers a redeploy or a preview.
  if (production?.endsWith(".vercel.app")) {
    const project = production.slice(0, -".vercel.app".length);
    deployments.push(`https://${project}-*.vercel.app`);
  }

  return [...new Set([appUrl, ...deployments, ...LOCAL_ORIGINS])];
}
