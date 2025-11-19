import { useEffect } from "react";

interface EffectTriggerProps {
    playWin: () => void;
    playTie: () => void;
    isTie: boolean;
}

export const EffectTrigger = ({ playWin, playTie, isTie }: EffectTriggerProps) => {
    useEffect(() => {
        if (isTie) {
            playTie();
        } else {
            playWin();
        }
    }, [playWin, playTie, isTie]);
    return null;
};
