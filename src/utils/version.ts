export const formatVersion = (v?: string) => {
  if (!v) return 'Unknown';
  try {
    const date = new Date(v);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${d}.${h}${min}`;
  } catch {
    return v.substring(0, 10);
  }
};
