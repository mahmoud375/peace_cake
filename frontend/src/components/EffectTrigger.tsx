import { useEffect } from "react";

export const EffectTrigger = ({ playWin }: { playWin: () => void }) => {
    useEffect(() => {
        playWin();
    }, [playWin]);
    return null;
};
