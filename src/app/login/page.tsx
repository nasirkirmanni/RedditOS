import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = Boolean(
    process.env.AUTH_USERNAME &&
      process.env.AUTH_PASSWORD_HASH &&
      process.env.AUTH_SECRET
  );

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: "var(--series-2)" }}
          >
            R
          </span>
          <span className="text-lg font-bold tracking-tight">
            Reddit<span style={{ color: "var(--series-2)" }}>OS</span>
          </span>
        </div>

        {configured ? (
          <LoginForm next={next ?? "/"} />
        ) : (
          <div className="card px-5 py-4">
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
              Login is not configured
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Set AUTH_USERNAME, AUTH_PASSWORD_HASH and AUTH_SECRET, then
              restart. Generate the hash with{" "}
              <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-xs">
                npm run hash-password
              </code>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
