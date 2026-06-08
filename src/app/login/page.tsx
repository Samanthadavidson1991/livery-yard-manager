import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/modules";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const yardName = (await getSetting("yard.name")) ?? "Livery Yard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-white">{yardName}</h1>
          <p className="text-brand-200 mt-1">Yard management portal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <LoginForm />
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Demo logins:</p>
            <p>admin@yard.test / admin123 (admin)</p>
            <p>jane@yard.test / livery123 (livery)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
