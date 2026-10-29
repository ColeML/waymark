import { isDatabaseReachable } from "@server/services/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reachable = await isDatabaseReachable();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 p-6">
      <h1 className="text-3xl font-semibold">Waymark</h1>
      <p>Spec sheets, a repair log, and what is due next. Coming soon.</p>
      <p>Database: {reachable ? "connected" : "unreachable"}</p>
    </main>
  );
}
