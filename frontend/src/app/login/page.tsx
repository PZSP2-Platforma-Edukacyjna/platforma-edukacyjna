import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="card w-full max-w-md p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Zaloguj się do swojego konta
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
