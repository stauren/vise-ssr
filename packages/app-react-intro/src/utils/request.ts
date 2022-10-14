import axios from 'axios';
import { SsrFetchConfig, SsrFetchResult } from 'vise-ssr';

export default async function request(config: SsrFetchConfig): Promise<SsrFetchResult> {
  let result: SsrFetchResult = {
    code: -1,
    msg: 'fetch fail',
    data: '',
  };
  try {
    const num: number[] = (await axios({
      ...config,
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
  } catch {}
  return result;
}
