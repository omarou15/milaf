import { SignUp } from "@clerk/nextjs";
export default function SignupPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#06070c]">
      <SignUp routing="path" path="/signup" afterSignUpUrl="/dashboard" />
    </div>
  );
}
