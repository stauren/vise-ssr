declare module 'postcss-px-to-viewport' {
  import * as Postcss from 'postcss';
  export type PostcssPxToVpArgs = {
    unitToConvert?: string,       // 要转化的单位
    viewportWidth?: number,       // UI设计稿的宽度
    unitPrecision?: number,       // 转换后的精度，即小数点位数
    propList?: string[],          // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
    viewportUnit?: string,        // 指定需要转换成的视窗单位，默认vw
    fontViewportUnit?: string,    // 指定字体需要转换成的视窗单位，默认vw
    selectorBlackList?: string[], // 指定不转换为视窗单位的类名，
    minPixelValue?: number,       // 默认值1，小于或等于1px则不进行转换
    mediaQuery?: boolean,         // 是否在媒体查询的css代码中也进行转换，默认false
    replace?: boolean,            // 是否转换后直接更换属性值
    exclude?: RegExp[],           // 设置忽略文件，用正则做目录名匹配
    landscape?: boolean,          // 是否处理横屏情况
  };
  const PostcssPxToVp: (args: PostcssPxToVpArgs) => Postcss.Plugin;
  export default PostcssPxToVp;
}
