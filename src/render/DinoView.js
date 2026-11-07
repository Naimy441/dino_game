import * as THREE from 'three';
import { dinoParts, gear } from './models.js';
import { voxelMaterial, glowMaterial } from './voxel.js';
import { GIANT_SCALE, ABILITY } from '../game/Game.js';

// The player's dino: a chunky voxel T-rex whose legs step in two choppy
// frames like a sprite, plus the gear each world hands it.

const BODY_X = -1.35;
const LEG_Y = 0.4;

export class DinoView {
  constructor(scene) {
    this.root = new THREE.Group(); // positioned at the dino's feet
    this.flipper = new THREE.Group(); // rolls upside down for gravity flips
    this.pose = new THREE.Group(); // spins, tilts and tricks
    this.root.add(this.flipper);
    this.flipper.add(this.pose);
    scene.add(this.root);

    this.look = null;
    this.body = new THREE.Mesh(undefined, voxelMaterial());
    this.duck = new THREE.Mesh(undefined, voxelMaterial());
    this.legA = new THREE.Mesh(undefined, voxelMaterial());
    this.legB = new THREE.Mesh(undefined, voxelMaterial());
    this.body.position.set(BODY_X, LEG_Y, 0);
    this.duck.position.set(BODY_X - 0.35, LEG_Y, 0);
    this.legA.position.set(BODY_X + 0.45, LEG_Y, 0.22);
    this.legB.position.set(BODY_X + 0.78, LEG_Y, -0.22);
    this.lift = new THREE.Group(); // raised when riding a cart/board
    this.lift.add(this.body, this.duck, this.legA, this.legB);
    this.pose.add(this.lift);

    // gear
    this.pickaxe = new THREE.Mesh(gear.pickaxe(), voxelMaterial());
    this.pickPivot = new THREE.Group();
    this.pickPivot.position.set(0.3, 1.25, 0.5);
    this.pickaxe.position.set(0, 0, 0);
    this.pickPivot.add(this.pickaxe);
    this.lift.add(this.pickPivot);

    this.cart = new THREE.Mesh(gear.cart(), voxelMaterial());
    this.cart.position.set(-0.25, 0, 0);
    this.cart.scale.x = -1;
    this.snowboard = new THREE.Mesh(gear.board('#e53935', '#ffffff'), voxelMaterial());
    this.hoverboard = new THREE.Mesh(gear.board('#ff2bd6', '#00f0ff'), glowMaterial());
    this.snowboard.position.set(-0.4, 0, 0);
    this.hoverboard.position.set(-0.4, 0.12, 0);
    this.pose.add(this.cart, this.snowboard, this.hoverboard);

    this.helmet = new THREE.Mesh(gear.helmet(), new THREE.MeshBasicMaterial({ color: '#cfefff', transparent: true, opacity: 0.28, depthWrite: false }));
    this.helmet.position.set(0.15, LEG_Y + 0.95, 0);
    this.lift.add(this.helmet);

    this.lamp = new THREE.Mesh(gear.lamp(), glowMaterial());
    this.lamp.position.set(0.15, LEG_Y + 1.47, 0);
    this.spot = new THREE.SpotLight('#fff3c4', 0, 46, 0.62, 0.45, 0);
    this.spot.position.set(0.3, 1.9, 0);
    this.spot.target.position.set(14, 0.2, 0);
    this.root.add(this.spot, this.spot.target);
    this.lift.add(this.lamp);
    this.glowLight = new THREE.PointLight('#ffffff', 0, 9, 0);
    this.glowLight.position.set(1, 2, 2);
    this.root.add(this.glowLight);
    // flashes of light from the dino's abilities (fire, muzzle, phase)
    this.actLight = new THREE.PointLight('#ff8a1a', 0, 14, 1.4);
    this.actLight.position.set(1.6, 1.4, 0.6);
    this.root.add(this.actLight);

    // new gear
    this.gun = new THREE.Mesh(gear.gun(), voxelMaterial());
    this.gunPivot = new THREE.Group();
    this.gunPivot.add(this.gun);
    this.lift.add(this.gunPivot);
    this.katana = new THREE.Mesh(gear.katana(), voxelMaterial());
    this.katanaPivot = new THREE.Group();
    this.katanaPivot.add(this.katana);
    this.lift.add(this.katanaPivot);
    this.headband = new THREE.Mesh(gear.headband(), voxelMaterial());
    this.headband.position.set(0.22, LEG_Y + 1.33, 0);
    this.lift.add(this.headband);
    this.pogo = new THREE.Mesh(gear.pogo(), voxelMaterial());
    this.pogo.position.set(-0.05, 0, 0);
    this.pose.add(this.pogo);
    this.parasol = new THREE.Mesh(gear.parasol(), voxelMaterial());
    this.parasol.position.set(-0.2, 2.45, 0);
    this.lift.add(this.parasol);
    this.parasolOpen = 0;
    this.phaseMat = new THREE.MeshBasicMaterial({ color: '#7dfff0', transparent: true, opacity: 0.45, depthWrite: false });
    this.phased = false;
    for (const m of [this.body, this.duck, this.legA, this.legB, this.pickaxe, this.cart, this.snowboard, this.gun, this.katana, this.pogo, this.parasol, this.headband]) m.castShadow = true;

    this.stepT = 0;
    this.frame = 0;
    this.flipAngle = 0;
    this.scale = 1;
    this.swing = 0;
    this.trickAngle = 0;
    this.hideHead = false;
    this.setLook('mono');
    this.setGear(null, {});
  }

  setLook(look) {
    if (look === this.look) return;
    this.look = look;
    const p = dinoParts(look);
    this.body.geometry = p.body;
    this.duck.geometry = p.duck;
    this.legA.geometry = p.leg;
    this.legB.geometry = p.leg;
  }

  setGear(gimmick, theme) {
    this.gimmick = gimmick;
    this.pickPivot.visible = gimmick === 'pickaxe';
    this.cart.visible = gimmick === 'cart';
    this.snowboard.visible = gimmick === 'snowboard';
    this.hoverboard.visible = gimmick === 'lanes';
    this.helmet.visible = gimmick === 'lowGravity' || gimmick === 'flip';
    this.lamp.visible = !!theme.headlamp;
    this.spot.intensity = theme.headlamp ? 9 : 0;
    this.glowLight.intensity = theme.headlamp ? 2.5 : 0;
    this.gunPivot.visible = gimmick === 'gun';
    this.katanaPivot.visible = gimmick === 'dash';
    this.headband.visible = gimmick === 'dash';
    this.pogo.visible = gimmick === 'pogo';
    this.parasol.visible = false;
    this.lift.position.y = gimmick === 'cart' ? 0.42 : gimmick === 'snowboard' ? 0.1 : gimmick === 'lanes' ? 0.3 : gimmick === 'pogo' ? 0.75 : 0;
  }

  // first person: hide what would sit inside the lens
  setFirstPerson(on) {
    this.body.visible = !on;
    this.duck.visible = !on && this.ducking;
    this.legA.visible = this.legB.visible = !on && this.gimmick !== 'cart';
    this.helmetHidden = on;
    this.firstPerson = on;
  }

  update(dt, game, alive) {
    const d = game.dino;
    const g = game.map.gimmick;
    this.ducking = d.ducking;
    this.root.position.set(0, d.y, d.z);
    // gravity flip: roll upside down around the track axis
    const wantFlip = d.grav < 0 ? Math.PI : 0;
    this.flipAngle += (wantFlip - this.flipAngle) * Math.min(1, dt * 16);
    this.flipper.rotation.x = this.flipAngle;
    // giant
    const ws = d.giant > 0 ? GIANT_SCALE : 1;
    this.scale += (ws - this.scale) * Math.min(1, dt * 8);
    this.flipper.scale.setScalar(this.scale);

    const fp = this.firstPerson;
    this.body.visible = !fp && !d.ducking;
    this.duck.visible = !fp && d.ducking;
    this.helmet.visible = (g === 'lowGravity' || g === 'flip') && !fp;
    const legsOn = !fp && g !== 'cart';
    this.legA.visible = this.legB.visible = legsOn;
    if (fp) this.lamp.visible = false;
    else this.lamp.visible = this.spot.intensity > 0;

    // choppy two-frame run cycle
    if (alive) this.stepT += dt * (6 + game.speed * 0.28);
    const frame = Math.floor(this.stepT) % 2;
    const running = d.grounded && alive && g !== 'snowboard' && g !== 'lanes';
    const swimming = g === 'swim' && !d.grounded;
    if (running || swimming) {
      this.legA.position.y = LEG_Y + (frame ? 0.12 : 0);
      this.legB.position.y = LEG_Y + (frame ? 0 : 0.12);
      this.legA.rotation.z = frame ? 0.5 : 0;
      this.legB.rotation.z = frame ? 0 : 0.5;
    } else {
      this.legA.position.y = this.legB.position.y = LEG_Y;
      this.legA.rotation.z = this.legB.rotation.z = 0;
    }
    if (d.ducking) {
      this.legA.position.x = BODY_X + 0.6;
      this.legB.position.x = BODY_X + 0.95;
    } else {
      this.legA.position.x = BODY_X + 0.45;
      this.legB.position.x = BODY_X + 0.78;
    }

    // pose: tilts, tricks, spins
    let pitch = 0;
    if (g === 'swim') pitch = Math.max(-0.5, Math.min(0.5, d.vy * 0.06));
    if (g === 'snowboard') {
      if (!d.grounded) this.trickAngle += dt * Math.min(14, 4 + d.airTime * 9);
      else {
        const target = Math.round(this.trickAngle / (Math.PI * 2)) * Math.PI * 2;
        this.trickAngle += (target - this.trickAngle) * Math.min(1, dt * 20);
      }
      pitch += this.trickAngle;
    } else this.trickAngle = 0;
    if (g === 'lanes') this.pose.rotation.x = -(d.z - (game.map.lanes ? [-1.7, 0, 1.7][d.lane] : 0)) * 0.25;
    else this.pose.rotation.x = 0;
    this.pose.rotation.z = pitch;
    this.pose.rotation.y = d.spin > 0 ? (1 - d.spin / 0.6) * Math.PI * 2 : 0;
    if (!alive) this.pose.rotation.z = 0.15;

    // pickaxe swing
    if (g === 'pickaxe') {
      const s = d.swingT > 0 ? 1 - d.swingT / 0.2 : 1;
      this.pickPivot.rotation.z = d.swingT > 0 ? 1.6 - s * 3.2 : 0.9 + Math.sin(this.stepT * Math.PI) * 0.05;
      this.pickPivot.position.y = d.ducking ? 0.75 : 1.25;
      this.pickPivot.position.x = d.ducking ? 0.6 : 0.3;
    }
    this.lamp.position.set(d.ducking ? 0.95 : 0.15, LEG_Y + (d.ducking ? 0.62 : 1.47), 0);

    // gun: held at the chest, kicks back on every shot
    if (g === 'gun') {
      const kick = d.actT > 0 ? d.actT / ABILITY.gun[0] : 0;
      this.gunPivot.position.set((d.ducking ? 0.95 : 0.5) - kick * 0.12, d.ducking ? 0.72 : 1.12, 0.42);
      this.gunPivot.rotation.z = kick * 0.35;
    }
    // katana rests on the back, sweeps forward on a dash
    if (g === 'dash') {
      const dash = d.actT > 0;
      this.katanaPivot.position.set(dash ? 0.9 : -0.5, dash ? 1.05 : 1.6, 0.45);
      this.katanaPivot.rotation.z = dash ? -1.45 : 2.4;
      this.headband.position.set(d.ducking ? 0.9 : 0.22, LEG_Y + (d.ducking ? 0.52 : 1.33), 0);
      this.headband.visible = !fp;
      if (dash) this.pose.rotation.z -= 0.22;
    }
    // swimming in the lagoon: sit low in the water, paddling
    if (g === 'paddle') {
      const want = d.y <= 0.01 ? -0.6 : 0;
      this.lift.position.y += (want - this.lift.position.y) * Math.min(1, dt * 10);
      this.pose.rotation.z = d.y < -0.05 ? -0.35 : Math.sin(this.stepT * 1.5) * 0.06;
    }
    // parasol pops open while gliding
    const wantOpen = g === 'glide' && d.gliding ? 1 : 0;
    this.parasolOpen += (wantOpen - this.parasolOpen) * Math.min(1, dt * 14);
    this.parasol.visible = this.parasolOpen > 0.05 && !fp;
    this.parasol.scale.set(this.parasolOpen, 0.4 + 0.6 * this.parasolOpen, this.parasolOpen);
    // pogo: the spring squashes on landing
    if (g === 'pogo') this.pogo.scale.y = d.y < 0.25 && d.vy > 0 ? 0.82 : 1;
    // phase: a see-through ghost of a dino
    const ph = g === 'phase' && d.actT > 0;
    if (ph !== this.phased) {
      this.phased = ph;
      for (const m of [this.body, this.duck, this.legA, this.legB]) m.material = ph ? this.phaseMat : voxelMaterial();
    }
    if (ph) this.phaseMat.opacity = 0.3 + Math.sin(performance.now() / 40) * 0.12;
    // ability light
    let li = 0, lc = null;
    if (d.fireT > 0) { li = 9 * (d.fireT / 0.42); lc = '#ff7a1a'; }
    else if (g === 'gun' && d.actT > 0) { li = 14 * (d.actT / ABILITY.gun[0]); lc = '#ffd23f'; }
    else if (ph) { li = 5; lc = '#5dfff0'; }
    else if (g === 'dash' && d.actT > 0) { li = 4; lc = '#ffffff'; }
    this.actLight.intensity = li;
    if (lc) this.actLight.color.set(lc);
  }

  // mouth position in world space (fire breath, bubbles)
  mouth(game, out) {
    const d = game.dino;
    const s = this.scale;
    const up = d.grav < 0 ? -1 : 1;
    return out.set(0.85 * s, d.y + up * (d.ducking ? 0.75 : 1.45) * s, d.z);
  }
}
