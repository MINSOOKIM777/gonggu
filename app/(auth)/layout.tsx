export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-w-md mx-auto py-16 px-4">{children}</div>;
}
