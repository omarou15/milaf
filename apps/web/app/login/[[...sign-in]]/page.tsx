import { SignIn } from "@clerk/nextjs";
export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#06070c]">
      <SignIn routing="path" path="/login" afterSignInUrl="/dashboard" />
    </div>
  );
}
