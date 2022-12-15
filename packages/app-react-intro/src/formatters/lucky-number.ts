export default function formatLuckyNumber(result: number | undefined) {
  return parseInt(String(result), 10) || -1;
}
