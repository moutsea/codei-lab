import HeroSection from "@/components/hero-section";
import ProductFeature from "@/components/product-feature";
import ProductFunctionality from "@/components/product-functionality";
import ProductWorkflows from "@/components/product-workflows";
import Pricing from "@/components/pricing";
import TokenPricing from "@/components/token-pricing";
import FAQ from "@/components/faq";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CaseStudyShowcase from "@/components/case-study-showcase";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#faf9f5]">
            <Header />
            {/* Hero Section */}
            <HeroSection />

            {/* Product Functionality */}
            <ProductFunctionality />

            {/* Product Workflows */}
            <ProductWorkflows />

            {/* Case Study */}
            <CaseStudyShowcase />
            {/* Pricing */}
            <section id="pricing">
                <Pricing />
            </section>
            <TokenPricing />

            {/* FAQ */}
            <section id="faq">
                <FAQ />
            </section>

            <Footer />
        </div>
    );
}
