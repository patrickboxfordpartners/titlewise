export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    method: string;
    path: string;
  },
  context: {
    routerKind: string;
    routerType: string;
  }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err, {
    tags: {
      method: request.method,
      path: request.path,
      routerKind: context.routerKind,
    },
  });
};
