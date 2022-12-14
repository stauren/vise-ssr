interface MarksReplaceParam {
  source: string,
  mark: string,
  // 如果 replacement 参数为 true，则使用当前 Marks 之间的内容替换(去除对外输出中的 marks)
  replacement: string | true,
  mode?: 'html' | 'script',
}

export function toKebab(camelString: string) {
  return camelString.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}

export function replaceContentBetweenMarks({
  source,
  mark,
  replacement,
  mode = 'script',
}: MarksReplaceParam) {
  let startMark = `// <!--START_${mark}`;
  let endMark = `// END_${mark}-->`;
  if (mode === 'html') {
    startMark = `<!--START_${mark}-->`;
    endMark = `<!--END_${mark}-->`;
  }
  const startPosition = source.indexOf(startMark);
  const endPosition = source.indexOf(endMark);

  if (startPosition === -1 || endPosition === -1) {
    return source;
  }

  // 如果 replacement 参数为 true，则使用当前 Marks 之间的内容替换(去除对外输出中的 marks)
  const realReplacement = replacement === true
    ? source.substring(startPosition + startMark.length, endPosition)
    : replacement;
  return [
    source.substring(0, startPosition),
    realReplacement,
    source.substring(endPosition + endMark.length),
  ].join('');
}

export function getPlaceholderOf(placeholderKey: string) {
  return `<!--ssr-${toKebab(placeholderKey)}-->`;
}

export function replacePlaceholderWithValue(
  source: string,
  placeholderKey: string,
  replacement: string,
) {
  const placeholder = getPlaceholderOf(placeholderKey);
  return source.replace(placeholder, replacement);
}
