import { AppShell } from "@/components/app/appShell";

export default function AuthenticatedLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <AppShell>
      {children}
      {modal}
    </AppShell>
  );
}
