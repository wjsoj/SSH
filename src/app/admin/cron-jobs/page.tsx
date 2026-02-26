import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminCronJobsClient } from "./AdminCronJobsClient";

export default async function AdminCronJobsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }
  return <AdminCronJobsClient />;
}
