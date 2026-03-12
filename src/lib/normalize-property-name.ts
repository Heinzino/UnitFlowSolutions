export function normalizePropertyName(name: string): string {
  return name.toLowerCase().trim()
}

export function propertyMatches(airtableName: string, assignedNames: string[]): boolean {
  const normalized = normalizePropertyName(airtableName)
  return assignedNames.map(normalizePropertyName).includes(normalized)
}

export function filterByProperties<T>(
  items: T[],
  getPropertyName: (item: T) => string,
  assignedNames: string[]
): T[] {
  return items.filter((item) => propertyMatches(getPropertyName(item), assignedNames))
}
