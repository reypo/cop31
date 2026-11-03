"""NOAA güneş konumu (Meeus tabanlı NOAA Solar Calculator algoritması). Saf Python; Blender'da ve sistem
Python'unda aynı sonucu verir.

    python -X utf8 gunes.py 2026-11-09T13:00 36.9397171 30.8175767

Çıktı: deklinasyon, zaman denklemi, güneş-altı noktası (enlem, boylam), verilen konumda yükseklik (kırılma
düzeltmeli ve düzeltmesiz) ve azimut (kuzeyden saat yönü)."""
import math
import sys
from datetime import datetime, timezone


def julian_gun(dt):
    dt = dt.astimezone(timezone.utc)
    y, m = dt.year, dt.month
    d = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24
    if m <= 2:
        y -= 1; m += 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5


def gunes(dt, enlem, boylam):
    jd = julian_gun(dt)
    t = (jd - 2451545.0) / 36525.0
    l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
    m = 357.52911 + t * (35999.05029 - 0.0001537 * t)
    e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
    mr = math.radians(m)
    c = (math.sin(mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) + math.sin(2 * mr) * (0.019993 - 0.000101 * t)
         + math.sin(3 * mr) * 0.000289)
    tl = l0 + c
    om = 125.04 - 1934.136 * t
    lam = tl - 0.00569 - 0.00478 * math.sin(math.radians(om))
    eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
    eps = eps0 + 0.00256 * math.cos(math.radians(om))
    dek = math.degrees(math.asin(math.sin(math.radians(eps)) * math.sin(math.radians(lam))))
    yv = math.tan(math.radians(eps / 2)) ** 2
    l0r = math.radians(l0)
    eot = 4 * math.degrees(yv * math.sin(2 * l0r) - 2 * e * math.sin(mr) + 4 * e * yv * math.sin(mr) * math.cos(2 * l0r)
                           - 0.5 * yv * yv * math.sin(4 * l0r) - 1.25 * e * e * math.sin(2 * mr))  # dakika
    u = dt.astimezone(timezone.utc)
    dk = u.hour * 60 + u.minute + u.second / 60
    # güneş-altı boylamı: gerçek güneş zamanı 12.00 olan boylam
    alt_boylam = -15.0 * ((dk + eot) / 60.0 - 12.0)
    alt_boylam = (alt_boylam + 180) % 360 - 180
    tst = (dk + eot + 4 * boylam) % 1440
    ha = tst / 4 - 180
    la, de, har = math.radians(enlem), math.radians(dek), math.radians(ha)
    cz = math.sin(la) * math.sin(de) + math.cos(la) * math.cos(de) * math.cos(har)
    cz = max(-1.0, min(1.0, cz))
    zen = math.degrees(math.acos(cz))
    yuk = 90 - zen
    # kırılma (NOAA)
    if yuk > 85:
        kir = 0
    elif yuk > 5:
        tz = math.tan(math.radians(yuk))
        kir = 58.1 / tz - 0.07 / tz ** 3 + 0.000086 / tz ** 5
    elif yuk > -0.575:
        kir = 1735 + yuk * (-518.2 + yuk * (103.4 + yuk * (-12.79 + yuk * 0.711)))
    else:
        kir = -20.772 / math.tan(math.radians(yuk))
    yuk_k = yuk + kir / 3600
    az_den = math.cos(la) * math.sin(math.radians(zen))
    if abs(az_den) > 1e-9:
        x = ((math.sin(la) * cz) - math.sin(de)) / az_den
        x = max(-1.0, min(1.0, x))
        # NOAA: öğleden sonra (ha > 0) az = acos(x) + 180, öğleden önce 540 − acos(x)
        if ha > 0:
            az = (math.degrees(math.acos(x)) + 180) % 360
        else:
            az = (540 - math.degrees(math.acos(x))) % 360
    else:
        az = 180.0 if la > 0 else 0.0
    return {"jd": jd, "deklinasyon": dek, "zaman_denklemi_dk": eot, "alt_nokta": (dek, alt_boylam),
            "yukseklik": yuk, "yukseklik_kirilmali": yuk_k, "azimut": az, "saat_acisi": ha}


def gunes_vektor_enu(yukseklik, azimut):
    """Yerel doğu-kuzey-yukarı çerçevesinde güneşe doğru birim vektör (Blender: X doğu, Y kuzey, Z yukarı)."""
    h, a = math.radians(yukseklik), math.radians(azimut)
    return (math.sin(a) * math.cos(h), math.cos(a) * math.cos(h), math.sin(h))


if __name__ == "__main__":
    s = sys.argv[1] if len(sys.argv) > 1 else "2026-11-09T13:00"
    la = float(sys.argv[2]) if len(sys.argv) > 2 else 36.9397171
    lo = float(sys.argv[3]) if len(sys.argv) > 3 else 30.8175767
    dt = datetime.fromisoformat(s).replace(tzinfo=timezone.utc)
    g = gunes(dt, la, lo)
    print(f"{s} UTC  dek {g['deklinasyon']:.3f}°  EoT {g['zaman_denklemi_dk']:.2f} dk  alt-nokta "
          f"{g['alt_nokta'][0]:.3f}, {g['alt_nokta'][1]:.3f}  yükseklik {g['yukseklik']:.2f}° (kırılmalı "
          f"{g['yukseklik_kirilmali']:.2f}°)  azimut {g['azimut']:.2f}°")
