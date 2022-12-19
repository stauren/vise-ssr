export type State = {
  count: number
  loading: boolean
  luckyNumber: number
};

export default function state(): State {
  return {
    count: 0,
    loading: false,
    luckyNumber: -1,
  };
}
