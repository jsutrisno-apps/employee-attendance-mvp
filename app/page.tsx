import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user?.role === "Admin") {
    redirect("/admin");
  }

  if (session?.user?.role === "Employee") {
    redirect("/employee");
  }

  redirect("/login");
}
