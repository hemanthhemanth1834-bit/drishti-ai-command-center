"""Spatial normalization + common grid (Step 4). Conventions + point assignment.

Decisions (reasoning: docs/SPATIAL-TEMPORAL-GRID.md):
- Exchange/storage CRS: EPSG:4326 (matches every global source + web maps).
- Metric ops (area/length): pilot UTM zone, recorded per dataset (Step 10+).
- Canonical rainfall grid: 0.1° — dictated by the coarsest important input
  (IMERG 0.1°); finer grids would invent detail the inputs cannot support.
- Resampling: nearest (categorical), bilinear (continuous), conservative (fluxes).
- Raster reprojection proper (rasterio/GDAL warp) arrives Step 10; Step 4
  implements grid definition + point-to-cell assignment (numpy only).
"""

from __future__ import annotations

from dataclasses import dataclass

CANONICAL_CRS = "EPSG:4326"
CANONICAL_RESOLUTION_DEG = 0.1  # set by IMERG, the coarsest key input


@dataclass(frozen=True)
class CommonGrid:
    crs: str = CANONICAL_CRS
    origin_lon: float = -180.0
    origin_lat: float = -90.0
    dx: float = CANONICAL_RESOLUTION_DEG
    dy: float = CANONICAL_RESOLUTION_DEG
    nx: int = 3600
    ny: int = 1800

    @classmethod
    def for_bbox(cls, bbox: list[float], dx: float = CANONICAL_RESOLUTION_DEG,
                 dy: float = CANONICAL_RESOLUTION_DEG) -> "CommonGrid":
        minlon, minlat, maxlon, maxlat = bbox
        import math
        nx = math.ceil((maxlon - minlon) / dx)
        ny = math.ceil((maxlat - minlat) / dy)
        return cls(origin_lon=minlon, origin_lat=minlat, dx=dx, dy=dy, nx=nx, ny=ny)

    def cell_of(self, lon: float, lat: float) -> tuple[int, int] | None:
        ix = int((lon - self.origin_lon) / self.dx)
        iy = int((lat - self.origin_lat) / self.dy)
        if 0 <= ix < self.nx and 0 <= iy < self.ny:
            return ix, iy
        return None

    def cell_center(self, ix: int, iy: int) -> tuple[float, float]:
        return (self.origin_lon + (ix + 0.5) * self.dx,
                self.origin_lat + (iy + 0.5) * self.dy)

    def extent(self) -> list[float]:
        return [self.origin_lon, self.origin_lat,
                self.origin_lon + self.nx * self.dx, self.origin_lat + self.ny * self.dy]


def snap_bbox_to_grid(bbox: list[float], dx: float = CANONICAL_RESOLUTION_DEG) -> list[float]:
    """Expand a bbox outward to grid lines so ROI extraction never clips a cell."""
    import math
    minlon, minlat, maxlon, maxlat = bbox
    return [math.floor(minlon / dx) * dx, math.floor(minlat / dx) * dx,
            math.ceil(maxlon / dx) * dx, math.ceil(maxlat / dx) * dx]
