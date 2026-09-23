// size = pieces in the collection, exchangeRate = duplicates needed per
// token, piecesPerContainer = pieces dropped per container opened,
// costPerContainer = shop price of one container (cost-based only),
// currency = display label for costs.
const COLLECTION_PRESETS = {
    costBased: [
        // Real collection - TODO: set costPerContainer to the actual shop price.
        { name: "The Hunt for Bismarck", size: 24, exchangeRate: 4, piecesPerContainer: 2, costPerContainer: 1000, currency: "coal" },
        { name: "Dunkirk", size: 16, exchangeRate: 5, piecesPerContainer: 2, costPerContainer: 1000, currency: "coal" },
        { name: "Vive la France", size: 18, exchangeRate: 3, piecesPerContainer: 2, costPerContainer: 1000, currency: "coal" },
        { name: "Honor, Integrity, Virtue", size: 60, exchangeRate: 2, piecesPerContainer: 1, costPerContainer: 2000, currency: "coal" },
        // PLACEHOLDER entries below - replace or delete.
        { name: "[Placeholder] Steel Armada", size: 40, exchangeRate: 3, piecesPerContainer: 1, costPerContainer: 0, currency: "doubloons" },
        { name: "[Placeholder] Admiral's Reserve", size: 30, exchangeRate: 4, piecesPerContainer: 1, costPerContainer: 0, currency: "doubloons" }
    ],
    earnedInBattle: [
        // PLACEHOLDER entries - replace or delete.
        { name: "[Placeholder] Dawn Patrol", size: 60, exchangeRate: 2, piecesPerContainer: 1 },
        { name: "[Placeholder] Frontline Chronicles", size: 50, exchangeRate: 2, piecesPerContainer: 2 }
    ]
};

const CATEGORY_LABELS = {
    costBased: "Cost-based collections",
    earnedInBattle: "Earned in battle"
};