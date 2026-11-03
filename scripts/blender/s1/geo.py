"""Ortak coğrafya: küresel Dünya (R = 6371008,8 m), Expo teğet (ENU) çerçevesi, eqc (expo-yerel-m).
numpy ile vektörel; Blender'ın Python'unda ve sistem Python'unda aynı."""
import math

import numpy as np

LAT0, LON0 = 36.9397171, 30.8175767        # Expo poligon merkezi (expo-harita.ts)
R = 6371008.8                                # eqc küre yarıçapı (R1 çerçevesiyle aynı)
KX, KY = 88874.70, 111195.08                 # m/derece (expo-yerel-m)
YER_ALCALT = 150.0                           # küre yüzeyi arazinin 150 m altında (arazi denizi ile z çakışmasın)


def eqc_latlon(x, y):
    """expo-yerel-m (x doğu, y GÜNEY) → enlem, boylam (derece)."""
    return LAT0 - np.asarray(y) / KY, LON0 + np.asarray(x) / KX


def latlon_eqc(lat, lon):
    return (np.asarray(lon) - LON0) * KX, (LAT0 - np.asarray(lat)) * KY


def ecef_birim(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)


def enu_matris(lat=LAT0, lon=LON0):
    """Satırlar: doğu, kuzey, yukarı (ECEF'te). dünya = M @ (ecef − ecef0)."""
    la, lo = math.radians(lat), math.radians(lon)
    e = [-math.sin(lo), math.cos(lo), 0.0]
    n = [-math.sin(la) * math.cos(lo), -math.sin(la) * math.sin(lo), math.cos(la)]
    u = [math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)]
    return np.array([e, n, u])


M_ENU = enu_matris()
ECEF0 = R * ecef_birim(LAT0, LON0)
DUNYA_MERKEZ = np.array([0.0, 0.0, -R])     # dünya çerçevesinde


def ecef_dunya(p):
    """ECEF metre → dünya (Blender) metre."""
    return (np.asarray(p, np.float64) - ECEF0) @ M_ENU.T


def dunya_ecef(p):
    return np.asarray(p, np.float64) @ M_ENU + ECEF0


def yon_ecef_dunya(v):
    return np.asarray(v, np.float64) @ M_ENU.T


def latlon_enu(lat, lon, h=0.0):
    """Küre yüzeyinde (enlem, boylam) + yükseklik h (radyal) → dünya metre."""
    p = (R + np.asarray(h, np.float64))[..., None] * ecef_birim(lat, lon)
    return ecef_dunya(p)


def dunya_latlon(p):
    """dünya metre → (enlem, boylam, yükseklik)."""
    e = dunya_ecef(p)
    r = np.linalg.norm(e, axis=-1)
    return np.degrees(np.arcsin(e[..., 2] / r)), np.degrees(np.arctan2(e[..., 1], e[..., 0])), r - R


def gunes_yonu_dunya(alt_enlem, alt_boylam):
    """Güneş-altı noktasından dünya çerçevesinde güneşe doğru birim vektör."""
    return yon_ecef_dunya(ecef_birim(alt_enlem, alt_boylam))
