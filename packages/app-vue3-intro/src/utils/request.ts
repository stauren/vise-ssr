import axios from 'axios';
import { SsrFetchConfig, SsrFetchResult } from 'vise-ssr';
import { IS_SSR } from '@/data/env';

export default async function request(config: SsrFetchConfig): Promise<SsrFetchResult> {
  let result: SsrFetchResult;
  let finalConfig = config;
  if (IS_SSR) {
    let { url } = config;
    // 这里是为了避免被 rollup 干掉所以不用 dot notation
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (process.env['VISE_INTRO'] && url?.startsWith('https://vise.internal.com/')) {
      // vise.com 域名上，本机请求本机的 443 端口会被 refuse
      url = url.replace(
        /^https:\/\/vise\.internal\.com\//,
        'http://127.0.0.1/',
      );
    }
    finalConfig = { ...config, url };
  }
  try {
    result = (await axios(finalConfig)).data;
  } catch {
    result = {
      code: -1,
      msg: 'fetch fail',
      data: '',
    };
  }
  return result;
}
