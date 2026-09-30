import { HomeHero, ServiceLevels, AfterBooking, VaultSection, Commitments, HomeFaq, ClosingCta } from "@/components/landing/home";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <ServiceLevels />
      <AfterBooking />
      <VaultSection />
      <Commitments />
      <HomeFaq />
      <ClosingCta />
    </>
  );
}
