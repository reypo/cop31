import type { Metadata } from "next";
import { Brosur } from "@/components/brosur/brosur";
import { cover } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dijital Broşür — COP31'de AK Gençlik",
  description: cover.subtitle,
};

export default function BrosurPage() {
  return <Brosur />;
}
