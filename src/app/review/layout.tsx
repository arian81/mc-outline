import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Review Uploaded Files" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
