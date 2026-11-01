/**
 * "CO₂" — alt simge rakamı fontta olmayabileceği için <sub> ile; satır
 * yüksekliğini bozmasın diye göreli konumlu.
 */
export default function Co2() {
  return (
    <>
      CO<sub className="relative top-[0.18em] align-baseline text-[0.62em] leading-none">2</sub>
    </>
  );
}
