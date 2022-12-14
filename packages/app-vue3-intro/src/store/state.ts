import { JSONObject } from 'vise-ssr';
import { IS_SSR } from '@/data/env';

export interface State extends JSONObject {
  startTime: number
  renderEndTime: number
  count: number
  luckyNumber: number
  sidebarToc: Record<string, string>
}

export default function state(): State {
  return {
    startTime: IS_SSR ? Date.now() : -1,
    renderEndTime: -1,
    count: 0,
    luckyNumber: -1,
    sidebarToc: {},
  };
}
