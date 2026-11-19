import * as THREE from 'three'

/**
 * The character's arm rig: where a shoulder sits and how long the upper arm and forearm are. Character.tsx builds
 * its arms from these numbers, so the poses below (and the test that checks them) describe the real rig.
 */
export const ARM = { x: 0.295, y: 1.36, upper: 0.32, hand: 0.27 }

/** Shoulder rotation about x (forward swing) and z (out to the side), and elbow bend about x. */
export type ArmPose = { sx: number; sz: number; ex: number }
export type Side = 'L' | 'R'

/** Where the elbow and the hand end up, in the character's own space, for a given pose. */
export const jointsAt = (side: Side, pose: ArmPose): { elbow: THREE.Vector3; hand: THREE.Vector3 } => {
  const shoulder = new THREE.Group()
  shoulder.position.set(side === 'L' ? -ARM.x : ARM.x, ARM.y, 0)
  shoulder.rotation.set(pose.sx, 0, pose.sz)
  const elbow = new THREE.Group()
  elbow.position.set(0, -ARM.upper, 0)
  elbow.rotation.set(pose.ex, 0, 0)
  const hand = new THREE.Group()
  hand.position.set(0, -ARM.hand, 0)
  shoulder.add(elbow)
  elbow.add(hand)
  shoulder.updateMatrixWorld(true)
  return { elbow: elbow.getWorldPosition(new THREE.Vector3()), hand: hand.getWorldPosition(new THREE.Vector3()) }
}
export const handAt = (side: Side, pose: ArmPose) => jointsAt(side, pose).hand

/** Reading: both hands together in front of the chest, holding the open book between them. */
export const READ_POSE: Record<Side, ArmPose> = {
  L: { sx: -0.46, sz: 0.36, ex: -1.52 },
  R: { sx: -0.46, sz: -0.36, ex: -1.52 },
}
/** Carrying: the right hand holds the closed book in front of the hip; the left arm swings as usual. */
export const CARRY_POSE: ArmPose = { sx: -0.02, sz: -0.1, ex: -1.34 }

