import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";
import { ReactNode } from "react";

const PublicLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <main>
      <Header />
      <div className="">{children}</div>
      <Footer />
    </main>
  );
};

export default PublicLayout;
