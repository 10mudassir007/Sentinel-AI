import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";


import APIDemo from "@/components/APIDemo";



import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        
        <APIDemo />
        
        
        
      </main>
      <Footer />
    </div>
  );
};

export default Index;
