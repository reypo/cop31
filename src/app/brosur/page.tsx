import type { Metadata } from "next";
import { Brosur } from "@/components/brosur/brosur";

export const metadata: Metadata = {
  title: "Dijital Broşür — 1 Milyon Genç, Tek Ortak Ev",
  description:
    "AK Parti Gençlik Kolları COP31 broşürü: sayılarla AK Gençlik, iklim için sahadayız, liderlik okulu, ÜniAK, gençlik şöleni ve COP31 taahhütlerimiz.",
};

export default function BrosurPage() {
  return <Brosur />;
}
