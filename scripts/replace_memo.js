module.exports = `
    const canHit = useMemo(() => {
        return isPlayerTurn && isPlaying && (!currentHand?.isDoubleDown || isMadness);
    }, [isPlayerTurn, isPlaying, currentHand?.isDoubleDown, isMadness]);

    const canSwitchHand = useMemo(() => {
        if (isPlayerTurn && currentSeat && rules.canSwitch) {
            return rules.canSwitch(currentSeat).allowed;
        }
        return false;
    }, [isPlayerTurn, currentSeat, rules]);

    const canStand = useMemo(() => {
        return isPlayerTurn && (isPlaying || (isBJ && canSwitchHand)) && !(isMadness && currentHand?.cards.length === 1);
    }, [isPlayerTurn, isPlaying, isBJ, canSwitchHand, isMadness, currentHand?.cards.length]);

    const { canDbl, isDblFree } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            const result = rules.canDoubleDown(currentHand);
            return {
                isDblFree: result.isFree,
                canDbl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canDbl: false, isDblFree: false };
    }, [isPlayerTurn, isPlaying, currentHand, rules, currentBalance]);

    const { canSpl, isSplFree } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            const result = rules.canSplit(currentHand, currentSeat?.hands.length || 0);
            return {
                isSplFree: result.isFree,
                canSpl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canSpl: false, isSplFree: false };
    }, [isPlayerTurn, isPlaying, currentHand, currentSeat?.hands.length, rules, currentBalance]);

    const canSur = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            return rules.canSurrender(currentHand).allowed;
        }
        return false;
    }, [isPlayerTurn, isPlaying, currentHand, rules]);

    const canZapHand = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand && rules.canZap) {
            return rules.canZap(currentHand).allowed;
        }
        return false;
    }, [isPlayerTurn, isPlaying, currentHand, rules]);

    const dealerHandCards = useGameStore((s) => s.dealerHand.cards);

    const exchangeAdvice = useMemo(() => {
        if (canSwitchHand && currentSeat && showSwitchAdvice && currentRoom === 'exchange_21' && currentSeat.hands.length === 2) {
            return getExchange21Advice(
                currentSeat.hands[0].cards,
                currentSeat.hands[1].cards,
                dealerHandCards[0]?.rank || '2',
                switchAdviceEngine,
            );
        }
        return null;
    }, [canSwitchHand, currentSeat, showSwitchAdvice, currentRoom, dealerHandCards, switchAdviceEngine]);

    const { canBurnHand, burnCost } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand && rules.canBurn) {
            const result = rules.canBurn(currentHand);
            return {
                canBurnHand: result.allowed && currentBalance >= result.cost,
                burnCost: result.cost
            };
        }
        return { canBurnHand: false, burnCost: 0 };
    }, [isPlayerTurn, isPlaying, currentHand, rules, currentBalance]);

`;
