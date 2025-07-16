import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1>Welcome {session.user.email}</h1>
      {/* User data from MongoDB: */}
      <pre>{JSON.stringify(session.user, null, 2)}</pre>
    </div>
  );
}