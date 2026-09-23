function simulateOneRun(
    collectionSize,
    exchangeRate,
    piecesPerContainer = 1,
    startingOwned = 0,
    startingDuplicateProgress = 0,
    startingBankedExchanges = 0
) {
    // Represent owned pieces as a set of IDs 1..collectionSize.
    // Since drops are uniform, WHICH ids are "already owned" doesn't matter
    // statistically - only the count does. So we just pre-fill the first N.
    const collected = new Set();
    for (let i = 1; i <= startingOwned; i++) collected.add(i);

    let duplicateQueue = startingDuplicateProgress;
    let bankedExchanges = startingBankedExchanges;
    let containerCount = 0;

    while (collected.size < collectionSize) {
        const missingCount = collectionSize - collected.size;

        if (bankedExchanges >= missingCount) {
            for (let i = 1; i <= collectionSize; i++) collected.add(i);
            break;
        }

        containerCount++;

        for (let i = 0; i < piecesPerContainer; i++) {
            if (collected.size >= collectionSize) break;

            const pull = Math.floor(Math.random() * collectionSize) + 1;
            if (!collected.has(pull)) {
                collected.add(pull);
            } else {
                duplicateQueue++;
                if (duplicateQueue % exchangeRate === 0) {
                    bankedExchanges++;
                }
            }
        }
    }

    return containerCount;
}

function runSimulation(
    runs,
    collectionSize,
    exchangeRate,
    piecesPerContainer = 1,
    startingOwned = 0,
    startingDuplicateProgress = 0,
    startingBankedExchanges = 0
) {
    const results = [];
    for (let i = 0; i < runs; i++) {
        results.push(
            simulateOneRun(
                collectionSize,
                exchangeRate,
                piecesPerContainer,
                startingOwned,
                startingDuplicateProgress,
                startingBankedExchanges
            )
        );
    }
    return results;
}