"use client";

import { useState } from "react";

/**
 * The card whose answer the back face shows. It only follows `card` while the
 * card is flipped, so moving to the next card during the flip-back (600ms
 * transition) can never paint the next card's answer on the turning back face,
 * however late the browser starts or finishes the animation.
 */
export function useBackFace<T>(card: T, flipped: boolean): T {
  const [back, setBack] = useState(card);
  if (flipped && back !== card) setBack(card);
  return flipped ? card : back;
}
