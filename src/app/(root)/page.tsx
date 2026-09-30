import { HomeHero, Commitments, ServiceTiers, HowItWorks, VaultTeaser, HomeFaq, ClosingCta } from "@/components/landing/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <Commitments />
      <ServiceTiers compact />
      <HowItWorks />
      <VaultTeaser />
      <HomeFaq />
      <ClosingCta />
    </>
  );
}
