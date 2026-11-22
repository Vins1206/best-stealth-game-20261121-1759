// vision.js — line of sight and vision-cone geometry.
//
// A guard sees the thief only when three things hold: the thief is inside
// the cone angle, inside the cone range, and no wall or crate crosses the
// straight line between them. Cones are drawn by casting a fan of rays and
// stopping each ray at the first solid it hits, so cones bend around
// cover exactly the way detection does.

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Sample-free slab test: does the segment cross the rectangle at all?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (const solid of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return false;
  }
  return true;
}

export function rayHitDistance(x, y, angle, maxDistance, solids) {
  // March in fine steps is too fuzzy at corners, so solve per rect with
  // the slab test and keep the nearest entry distance along the ray.
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDistance;
  for (const rect of solids) {
    let tMin = 0;
    let tMax = Infinity;
    if (Math.abs(dx) < 1e-9) {
      if (x < rect.x || x > rect.x + rect.w) continue;
    } else {
      let t1 = (rect.x - x) / dx;
      let t2 = (rect.x + rect.w - x) / dx;
      if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
    }
    if (Math.abs(dy) < 1e-9) {
      if (y < rect.y || y > rect.y + rect.h) continue;
    } else {
      let t1 = (rect.y - y) / dy;
      let t2 = (rect.y + rect.h - y) / dy;
      if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
    }
    if (tMin <= tMax && tMin > 0.5 && tMin < best) best = tMin;
  }
  return best;
}

export function buildConePolygon(guard, range, halfAngle, rayCount, solids) {
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rayCount; i += 1) {
    const angle = guard.facing - halfAngle + (2 * halfAngle * i) / rayCount;
    const distance = rayHitDistance(guard.x, guard.y, angle, range, solids);
    points.push({ x: guard.x + Math.cos(angle) * distance, y: guard.y + Math.sin(angle) * distance });
  }
  return points;
}

export function guardCanSee(guard, target, range, halfAngle, solids) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return { seen: false, distance };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleTo, guard.facing)) > halfAngle) return { seen: false, distance };
  if (!hasLineOfSight(guard.x, guard.y, target.x, target.y, solids)) return { seen: false, distance };
  return { seen: true, distance };
}
