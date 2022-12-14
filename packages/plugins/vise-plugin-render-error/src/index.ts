import {
  VisePlugin,
  HTTPResponse,
  RenderResult,
  RenderResultCategory,
  RenderError,
} from 'vise-ssr';

export default function renderErrorPlugin(
  templates: Record<string, string>,
  log: (...args: any) => void,
  userReport?: (reportOpts: { renderBy: string, error: RenderError }) => void,
): VisePlugin {
  async function beforeResponse(renderResult: RenderResult): Promise<HTTPResponse | void> {
    // 渲染异常时采用CSR兜底
    if (renderResult.type === RenderResultCategory.error) {
      const { context: { extra: { projectName } }, error, renderBy } = renderResult;
      const { message, detail } = error;
      log(`[vise render error]: ${renderBy}`, message, detail);
      if (userReport) {
        userReport({
          renderBy,
          error,
        });
      }
      return {
        code: 302,
        headers: {
          'content-type': 'text/html;charset=utf-8',
        },
        body: templates[projectName as string],
      };
    }
  }
  return {
    name: 'vise-plugin-render-error',
    hooks: {
      beforeResponse,
    },
  };
}
