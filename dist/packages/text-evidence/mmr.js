export function dot(a, b) {
    let sum = 0;
    for (const [key, value] of a)
        sum += value * (b.get(key) ?? 0);
    return sum;
}
/** Inputs must be sorted by decreasing query similarity and contain unit vectors. */
export function selectMMR(items, limit, lambda) {
    if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(lambda) || lambda < 0 || lambda > 1)
        throw new RangeError('Invalid MMR limit/lambda');
    if (!items.length)
        return [];
    if (items.length <= limit || lambda === 1)
        return items.slice(0, limit);
    const selected = [0], remaining = new Set(items.map((_, i) => i).slice(1));
    while (selected.length < limit && remaining.size) {
        let best = -1, bestScore = -Infinity;
        for (const index of remaining) {
            const redundancy = Math.max(...selected.map(i => dot(items[index].vector, items[i].vector)));
            const score = lambda * items[index].score - (1 - lambda) * redundancy;
            if (score > bestScore) {
                bestScore = score;
                best = index;
            }
        }
        selected.push(best);
        remaining.delete(best);
    }
    return selected.map(i => items[i]);
}
//# sourceMappingURL=mmr.js.map