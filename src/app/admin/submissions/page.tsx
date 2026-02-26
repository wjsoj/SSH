import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSubmissionsClient } from "./AdminSubmissionsClient";

export default async function AdminSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }
  return <AdminSubmissionsClient />;
}
