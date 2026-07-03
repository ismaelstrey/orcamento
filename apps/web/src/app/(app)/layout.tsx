import { AppShell } from "@/components/app/appShell";

export default function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
