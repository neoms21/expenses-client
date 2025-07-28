export const extractTagsFromDescription = (description: string) =>
  description
    .split(' ')
    .filter((a) => a.length > 2 && a.trim() && !a.match(/\d{1,9}/g))
    .map((x) => ({ name: x.trim(), key: x.trim() }));
