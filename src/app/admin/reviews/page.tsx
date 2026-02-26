import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminReviewsClient } from "./AdminReviewsClient";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }
  return <AdminReviewsClient />;
}
