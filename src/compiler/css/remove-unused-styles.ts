import { BuildConfig, Diagnostic } from '../../util/interfaces';
import { parseCss } from './parse-css';
import { StringifyCss } from './stringify-css';
import { UsedSelectors } from '../html/used-selectors';


export function removeUnusedStyles(config: BuildConfig, usedSelectors: UsedSelectors, cssContent: string, cssFilePath?: string, diagnostics?: Diagnostic[]) {
  let cleanedCss = cssContent;

  try {
    // parse the css from being applied to the document
    const cssAst = parseCss(config, cssContent, cssFilePath);

    if (cssAst.stylesheet.diagnostics.length) {
      cssAst.stylesheet.diagnostics.forEach(d => {
        diagnostics.push(d);
      });
      return cleanedCss;
    }

    try {
      // convert the parsed css back into a string
      // but only keeping what was found in our active selectors
      const stringify = new StringifyCss(usedSelectors);
      cleanedCss = stringify.compile(cssAst);

    } catch (e) {
      diagnostics.push({
        level: 'error',
        type: 'css',
        header: 'CSS Stringify',
        messageText: e
      });
    }

  } catch (e) {
    diagnostics.push({
      level: 'error',
      type: 'css',
      absFilePath: cssFilePath,
      header: 'CSS Parse',
      messageText: e
    });
  }

  return cleanedCss;
}
