import axios from 'axios';

export type FetchResult = {
  code: number,
  msg: string,
  data: any,
};

export default async function request(url: string): Promise<FetchResult> {
  let result: FetchResult = {
    code: -1,
    msg: 'fetch fail',
    data: '',
  };
  try {
    const num: number[] = (await axios({
      url,
      timeout: 1000,
    })).data;
    if (typeof num[0] === 'number') {
      result = {
        code: 0,
        msg: 'ok',
        data: {
          value: num[0],
        },
      };
    }
  } catch {
    // ignore
  }
  return result;
}
