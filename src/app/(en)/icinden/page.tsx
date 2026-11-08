import { IcindenSayfa, icindenMetadata } from "@/components/icinden/IcindenSayfa";

export const metadata = icindenMetadata("en");

export default function IcindenEn() {
  return <IcindenSayfa dil="en" />;
}
