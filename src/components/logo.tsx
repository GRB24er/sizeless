import Image from "next/image";
import Link from "next/link";
import { MotionDiv } from "./motion.div";

export const Logo = () => (
  <MotionDiv
    className="flex items-center gap-5 "
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    <Link href="/">
      <Image
        src="/images/logo.png"
        alt="AramexLogistics"
        width={200}
        height={150}
        className="transition-all duration-300"
      />
    </Link>
  </MotionDiv>
);
