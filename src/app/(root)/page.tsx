import { Hero } from "@/components/sections/hero";
import { Choice } from "@/components/sections/choice";
import { Achievement } from "@/components/sections/archieve";
import { Service } from "@/components/sections/Services";
import { GlobalNetwork } from "@/components/sections/network";
import { Quota } from "@/components/sections/quota";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Choice />
      <Achievement />
      <Service />
      <GlobalNetwork />
      <Quota />
    </>
  );
}
