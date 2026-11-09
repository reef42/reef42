# Calculators

Bilingual (English / Hungarian) reef aquarium calculators. Static HTML/CSS/JS, no build step.

| Calculator | Route | What it does |
| --- | --- | --- |
| Aquarium volume | `#/volume` | Rectangular, cylinder, half-cylinder, hexagonal and bow-front tanks; glass thickness, water level, displacement, sump; water weight |
| Salt mix | `#/saltmix` | Salt needed for new saltwater, per brand mixing ratio (Red Sea, Tropic Marin, Aquaforest, Fauna Marin, Instant Ocean or custom), scaled to the target salinity |
| Salinity correction | `#/directsalt` | Raise salinity with dissolved salt or lower it with RO/DI, at most 1 ppt a day |
| Sand bed | `#/sand` | Sand mass, volume and bags for a bed depth |
| Phosphate media dose | `#/gfo` | Starting dose for ROWAphos, Tropic Marin Elimi-Phos, Seachem PhosNet, Seachem PhosGuard or a custom rate |
| Unit converters | `#/convert` | Salinity (ppt, SG at 25/20/15.6 °C, conductivity, density), hydrometer temperature correction, temperature, volume, alkalinity, phosphate, nitrate, nitrite, ammonia |
| Water change | `#/waterchange` | Parameters after one or more changes; change size for a target nitrate |

- Units (metric, US, UK) and the salinity scale (ppt or SG) can be switched on every calculator. Values are stored in SI
  units, so switching does not lose precision.
- Inputs are remembered in `localStorage` (`reef42-calcs-v1`).
- Volume fields offer one-click chips with the tank volumes saved in Tank Log (`reef42-tanklog-v1`, same origin) and the
  last result of the volume calculator.
- Salinity, specific gravity, density and conductivity use the UNESCO EOS-80 equation of state and the PSS-78 practical
  salinity scale (Fofonoff & Millard 1983, UNESCO Technical Papers in Marine Science 44).
- Every calculator has a "How it is calculated" section with the formula, notes and sources wherever the formula or the
  numbers are not common knowledge.
- Product presets are limited to brands sold in Hungarian reef shops; anything else can be entered with the "Other" option.
