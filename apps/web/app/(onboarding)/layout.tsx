export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#06070c] flex flex-col">
      {children}
    </div>
  );
}
