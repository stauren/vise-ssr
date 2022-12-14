import enquirer from 'enquirer';
import type { SupportedScaffold } from '@vise-ssr/shared';
import { ScaffoldToPackage } from '@vise-ssr/shared';

interface IAppName {
  templateType: SupportedScaffold,
}

export default async function createNewApp() {
  const answers: IAppName = await enquirer.prompt([
    {
      type: 'select',
      message: 'Please Choose app scaffold:',
      name: 'templateType',

      // 目前有 vue3, react app 模板，后续考虑增加 plugin 等
      choices: Object.keys(ScaffoldToPackage),
    },
  ]);

  const { creator } = await import(ScaffoldToPackage[answers.templateType]);
  return creator();
}
