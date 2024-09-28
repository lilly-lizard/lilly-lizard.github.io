
/* ------- DESCARTES' THEOREM ------- */


function descartes(c1,c2,c3) {
  // returns two circles of the 4 possible outcomes of Descartes' theorem
  // https://en.wikipedia.org/wiki/Descartes%27_theorem#Complex_Descartes_theorem

  // these now have a full set so they can be reset
  c1.tangent_circles = [];
  c2.tangent_circles = [];
  c3.tangent_circles = [];

  // two curvature values:
  // discriminent (gets set to 0 if negative)
  var disc_k = c1.k*c2.k + c1.k*c3.k + c2.k*c3.k;
  disc_k = disc_k < 0 ? 0: disc_k;
  // calculate 2 k values
  var k_p = c1.k + c2.k + c3.k + 2*sqrt(disc_k);
  var k_m = c1.k + c2.k + c3.k - 2*sqrt(disc_k);

  // two center points:
  var v12 = c1.zs.mult(c2.zs);
  var v13 = c1.zs.mult(c3.zs);
  var v23 = c2.zs.mult(c3.zs);
  // sum term
  var sum = c1.zs.add(c2.zs.add(c3.zs));
  // sqrt term
  var disc_z = v12.add(v13.add(v23));
  disc_z = disc_z.sqrtz().scale(2);

  // pp and mm circles:
  var z_pp = sum.add(disc_z).scale(1/k_p);
  var z_mm = sum.sub(disc_z).scale(1/k_m);
  var c_pp = new circle(k_p, z_pp);
  var c_mm = new circle(k_m, z_mm);
  c_pp.tangent_circles = [c1,c2,c3];
  c_mm.tangent_circles = [c1,c2,c3];
  if ( is_connected(c_pp, c1, c2, c3) && is_connected(c_mm, c1, c2, c3) )
    return [c_pp,c_mm];

  // else pm and mp circles:
  var z_pm = sum.sub(disc_z).scale(1/k_p);
  var z_mp = sum.add(disc_z).scale(1/k_m);
  var c_pm = new circle(k_p, z_pm);
  var c_mp = new circle(k_m, z_mp);
  c_pm.tangent_circles = [c1,c2,c3];
  c_mp.tangent_circles = [c1,c2,c3];
  return [c_pm, c_mp];
}

function is_connected(c, c1, c2, c3) {
  // is c tangent to c1, c2 and c3?
  return is_tangent(c, c1) && is_tangent(c, c2) && is_tangent(c, c3);
}

function is_tangent(c1, c2) {
  // are these two circles tangental to each other?
  var z12 = c2.z.sub(c1.z);
  var mod = z12.modulus();
  // to be tangental: mag(z1 - z2) == r1 + r2
  var internal = abs(mod - (c1.r + c2.r)) < tolerance;
  // or: mag(z1 - z2) == abs(r1 - r2)
  var external = abs(mod - abs(c1.r - c2.r)) < tolerance;
  return internal || external;
}
