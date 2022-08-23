export type State = {
  count: number
  luckyNumber: number
};

export default function state(): State {
  return {
    count: 0,
    luckyNumber: -1,
  };
}
