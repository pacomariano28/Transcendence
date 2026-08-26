type ScoredEntry = {
  score: number;
};

export function computeCompetitionRanks<T extends ScoredEntry>(
  entries: T[],
): number[] {
  const ranks: number[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    if (index === 0 || entries[index].score !== entries[index - 1].score) {
      ranks.push(index + 1);
    } else {
      ranks.push(ranks[index - 1]);
    }
  }

  return ranks;
}
