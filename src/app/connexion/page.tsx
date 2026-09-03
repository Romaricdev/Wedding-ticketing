import { LoginForm } from "@/components/shared/login-form";
import {
  getActiveEventUser,
  getSessionUser,
  redirectToRoleHome,
} from "@/server/auth";

export default async function ConnexionPage() {
  const user = await getSessionUser();

  if (user) {
    const eventUser = await getActiveEventUser(user.id);

    if (eventUser) {
      redirectToRoleHome(eventUser.role);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
