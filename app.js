const SIMULATION_RUNS = 10000;
let histogramChart = null;

// Pick up a preset passed from presets.html, if any, then clear it so a
// plain reload of this page doesn't keep reapplying stale values.
(function applyIncomingPreset() {
    const raw = sessionStorage.getItem("presetToApply");
    if (raw) {
        const preset = JSON.parse(raw);
        document.getElementById("collectionSize").value = preset.size;
        document.getElementById("exchangeRate").value = preset.exchangeRate;
        document.getElementById("piecesPerContainer").value = preset.piecesPerContainer;
        if (preset.costPerContainer != null) {
            document.getElementById("costPerContainer").value = preset.costPerContainer;
        }
        sessionStorage.setItem("presetCurrency", preset.currency || "");
        sessionStorage.removeItem("presetToApply");
    }
})();

// Mode: battle-earned containers have no purchase price, so the cost field
// is hidden for that category. Cost-based and manual entry both show it
// (manual users may be recreating a cost-based collection).
(function configureMode() {
    if (sessionStorage.getItem("category") === "earnedInBattle") {
        document.getElementById("costField").style.display = "none";
        document.getElementById("costPerContainer").value = 0;
    }
})();

document.getElementById("changeCollectionBtn").addEventListener("click", () => {
    hideBreakdown();
    const category = sessionStorage.getItem("category");
    location.href = category ? "presets.html" : "index.html";
});

function computeStats(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = data.reduce((sum, x) => sum + (x - mean) ** 2, 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const p90 = sorted[Math.floor(sorted.length * 0.90)];

    return {
        mean, median, stdDev, p75, p90,
        min: sorted[0],
        max: sorted[sorted.length - 1]
    };
}

function computeHistogram(data, binCount = 20) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(max - min, 1);
    const binWidth = Math.max(1, Math.ceil(range / binCount));
    const bins = {};

    data.forEach(value => {
        const binStart = min + Math.floor((value - min) / binWidth) * binWidth;
        bins[binStart] = (bins[binStart] || 0) + 1;
    });

    const labels = Object.keys(bins).map(Number).sort((a, b) => a - b);
    return {
        labels: labels.map(l =>
            binWidth > 1 ? `${l}-${l + binWidth - 1}` : `${l}`
        ),
        counts: labels.map(l => bins[l])
    };
}

function renderHistogram(data, median) {
    const { labels, counts } = computeHistogram(data);
    const ctx = document.getElementById("histogram");

    // Figure out which bin the median falls into so we can highlight it -
    // labels are either "N" or "N-M" ranges, parse the lower bound of each.
    const medianBinIndex = labels.findIndex(label => {
        const [lo, hi] = label.split("-").map(Number);
        const upper = Number.isNaN(hi) ? lo : hi;
        return median >= lo && median <= upper;
    });

    const colors = labels.map((_, i) =>
        i === medianBinIndex ? "#4A6B6F" : "#C9A227"
    );

    if (histogramChart) {
        histogramChart.destroy();
    }

    histogramChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Runs",
                data: counts,
                backgroundColor: colors,
                borderRadius: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    ticks: { color: "#8B94A0", maxRotation: 60, minRotation: 60, font: { size: 10 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#8B94A0" },
                    grid: { color: "rgba(255,255,255,0.05)" }
                }
            }
        }
    });
}

function revealBreakdown() {
    document.getElementById("layout").classList.add("expanded");
    document.getElementById("breakdown").classList.add("visible");
}

function hideBreakdown() {
    document.getElementById("layout").classList.remove("expanded");
    document.getElementById("breakdown").classList.remove("visible");
}

function showMessage(text, isError = false) {
    hideBreakdown();
    document.getElementById("errorMessage").innerHTML = `
    <div class="stamp">
      <h3>${isError ? "Input Error" : "Simulation Result"}</h3>
      <div class="stat-row">
        <span class="stat-label">Status</span>
        <span class="stat-value hero">${text}</span>
      </div>
    </div>
  `;
}

function clampNegative(value, fallback = 1) {
    return (Number.isNaN(value) || value < 0) ? fallback : value;
}

document.getElementById("runBtn").addEventListener("click", () => {
    const collectionSizeInput = document.getElementById("collectionSize");
    const exchangeRateInput = document.getElementById("exchangeRate");
    const piecesPerContainerInput = document.getElementById("piecesPerContainer");
    const startingOwnedInput = document.getElementById("startingOwned");
    const startingDuplicateProgressInput = document.getElementById("startingDuplicateProgress");
    const startingBankedExchangesInput = document.getElementById("startingBankedExchanges");

    const collectionSize = clampNegative(parseInt(collectionSizeInput.value));
    const exchangeRate = clampNegative(parseInt(exchangeRateInput.value));
    const piecesPerContainer = clampNegative(parseInt(piecesPerContainerInput.value));
    // Optional fields: an empty box means "none", not 1.
    const startingOwned = clampNegative(parseInt(startingOwnedInput.value), 0);
    const startingDuplicateProgress = clampNegative(parseInt(startingDuplicateProgressInput.value), 0);
    const startingBankedExchanges = clampNegative(parseInt(startingBankedExchangesInput.value), 0);
    const costInput = document.getElementById("costPerContainer");
    const costPerContainer = clampNegative(parseFloat(costInput.value), 0);
    costInput.value = costPerContainer;

    collectionSizeInput.value = collectionSize;
    exchangeRateInput.value = exchangeRate;
    piecesPerContainerInput.value = piecesPerContainer;
    startingOwnedInput.value = startingOwned;
    startingDuplicateProgressInput.value = startingDuplicateProgress;
    startingBankedExchangesInput.value = startingBankedExchanges;

    if (collectionSize < 1 || exchangeRate < 1 || piecesPerContainer < 1) {
        showMessage(
            "Collection size, exchange rate, and pieces per container must be at least 1",
            true
        );
        return;
    }

    if (startingDuplicateProgress >= exchangeRate) {
        showMessage(
            `Duplicate progress must be less than ${exchangeRate} (the exchange rate)`,
            true
        );
        return;
    }

    if (startingOwned + startingBankedExchanges >= collectionSize) {
        showMessage("Collection already complete");
        return;
    }

    const data = runSimulation(
        SIMULATION_RUNS,
        collectionSize,
        exchangeRate,
        piecesPerContainer,
        startingOwned,
        startingDuplicateProgress,
        startingBankedExchanges
    );
    const stats = computeStats(data);
    document.getElementById("errorMessage").innerHTML = "";
    renderHistogram(data, stats.median);
    revealBreakdown();

    const currency = sessionStorage.getItem("presetCurrency") || "";
    const fmtCost = v => Math.round(v).toLocaleString() + (currency ? " " + currency : "");
    const costRows = costPerContainer > 0 ? `
      <div class="stat-row">
        <span class="stat-label">Estimated cost (median)</span>
        <span class="stat-value">${fmtCost(stats.median * costPerContainer)}</span>
      </div>` : "";
    const costDetailRows = costPerContainer > 0 ? `
        <div class="stat-row">
          <span class="stat-label">Estimated cost (90th percentile)</span>
          <span class="stat-value">${fmtCost(stats.p90 * costPerContainer)}</span>
        </div>` : "";

    document.getElementById("results").innerHTML = `
    <div class="stamp">
      <h3>Simulation Result - ${SIMULATION_RUNS.toLocaleString()} runs</h3>
      <div class="stat-row">
        <span class="stat-label">Median containers remaining</span>
        <span class="stat-value hero">${stats.median}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Mean</span>
        <span class="stat-value">${stats.mean.toFixed(2)}</span>
      </div>${costRows}
      <details class="collapse">
        <summary>More details</summary>
        <div class="collapse-body">
          <div class="stat-row">
            <span class="stat-label">75th percentile</span>
            <span class="stat-value">${stats.p75}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">90th percentile</span>
            <span class="stat-value">${stats.p90}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Std Dev</span>
            <span class="stat-value">${stats.stdDev.toFixed(2)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Range</span>
            <span class="stat-value">${stats.min} - ${stats.max}</span>
          </div>${costDetailRows}
        </div>
      </details>
    </div>
  `;
});