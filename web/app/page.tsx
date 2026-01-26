import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HomeContent } from "@/components/HomeContent";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen font-[family-name:var(--font-geist-sans)] bg-white dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <div className="flex justify-center items-center p-8 sm:p-20">
        <HomeContent />
      </div>
      <Footer />
    </div>
  );
}
