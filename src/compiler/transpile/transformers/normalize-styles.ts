import { BuildConfig, ComponentMeta, ComponentOptions, ModuleFileMeta, StyleMeta } from '../../interfaces';
import { normalizePath } from '../../util';


export function normalizeStyles(config: BuildConfig, userOpts: ComponentOptions, moduleFile: ModuleFileMeta, cmpMeta: ComponentMeta) {
  normalizeStyleStr(userOpts, cmpMeta);
  normalizeStylePath(config, userOpts, moduleFile, cmpMeta);
  normalizeStylePaths(config, userOpts, moduleFile, cmpMeta);
}


function normalizeStyleStr(userOpts: ComponentOptions, cmpMeta: ComponentMeta) {
  if (typeof userOpts.styles === 'string' && userOpts.styles.trim().length) {

    cmpMeta.stylesMeta = cmpMeta.stylesMeta || {};
    cmpMeta.stylesMeta.$ = cmpMeta.stylesMeta.$ || {};

    cmpMeta.stylesMeta.$.styleStr = userOpts.styles.trim();
  }
}


function normalizeStylePath(config: BuildConfig, userOpts: ComponentOptions, moduleFile: ModuleFileMeta, cmpMeta: ComponentMeta) {
  if (typeof userOpts.styleUrl === 'string' && userOpts.styleUrl.trim()) {
    // as a string
    // styleUrl: 'my-styles.scss'

    cmpMeta.stylesMeta = cmpMeta.stylesMeta || {};
    cmpMeta.stylesMeta.$ = cmpMeta.stylesMeta.$ || {};

    normalizeModeStylePaths(config, moduleFile, cmpMeta.stylesMeta.$, userOpts.styleUrl);
  }
}


function normalizeStylePaths(congif: BuildConfig, userOpts: ComponentOptions, moduleFile: ModuleFileMeta, cmpMeta: ComponentMeta) {
  if (!userOpts.styleUrls) {
    return;
  }

  // normalize the possible styleUrl structures

  if (Array.isArray(userOpts.styleUrls)) {
    // as an array of strings
    // styleUrls: ['my-styles.scss', 'my-other-styles']

    userOpts.styleUrls.forEach(styleUrl => {
      if (styleUrl && typeof styleUrl === 'string' && styleUrl.trim()) {

        cmpMeta.stylesMeta = cmpMeta.stylesMeta || {};
        cmpMeta.stylesMeta.$ = cmpMeta.stylesMeta.$ || {};
        normalizeModeStylePaths(congif, moduleFile, cmpMeta.stylesMeta.$, userOpts.styleUrl);
      }
    });
    return;
  }

  // as an object
  // styleUrls: {
  //   ios: 'badge.ios.scss',
  //   md: 'badge.md.scss',
  //   wp: 'badge.wp.scss'
  // }
  const styleModes: {[modeName: string]: string} = (<any>userOpts).styleUrls;

  Object.keys(styleModes).forEach(styleModeName => {
    const modeName = styleModeName.trim().toLowerCase();

    if (typeof styleModes[styleModeName] === 'string' && styleModes[styleModeName].trim()) {
      cmpMeta.stylesMeta = cmpMeta.stylesMeta || {};
      cmpMeta.stylesMeta[modeName] = cmpMeta.stylesMeta[modeName] || {};
      normalizeModeStylePaths(congif, moduleFile, cmpMeta.stylesMeta[styleModeName], styleModes[styleModeName]);

    } else if (Array.isArray(styleModes[styleModeName])) {
      const styleUrls: string[] = (<any>userOpts).styleUrls;

      styleUrls.forEach(styleUrl => {
        if (styleUrl && typeof styleUrl === 'string' && styleUrl.trim().length) {
          cmpMeta.stylesMeta = cmpMeta.stylesMeta || {};
          cmpMeta.stylesMeta[modeName] = cmpMeta.stylesMeta[modeName] || {};

          normalizeModeStylePaths(congif, moduleFile, cmpMeta.stylesMeta[styleModeName], styleUrl);
        }
      });
    }
  });
}


function normalizeModeStylePaths(config: BuildConfig, moduleFile: ModuleFileMeta, modeStyleMeta: StyleMeta, stylePath: string) {
  modeStyleMeta.cmpRelativePaths = modeStyleMeta.cmpRelativePaths || [];
  modeStyleMeta.absolutePaths = modeStyleMeta.absolutePaths || [];

  // get the absolute path of the directory which the component is sitting in
  const componentDir = normalizePath(config.sys.path.dirname(moduleFile.tsFilePath));

  // get the relative path from the component file to the style
  let componentRelativeStylePath = normalizePath(stylePath.trim());

  if (config.sys.path.isAbsolute(componentRelativeStylePath)) {
    // this path is absolute already!
    // add to our list of style absolute paths
    modeStyleMeta.absolutePaths.push(componentRelativeStylePath);

    // if this is an absolute path already, let's convert it to be relative
    componentRelativeStylePath = config.sys.path.relative(componentDir, componentRelativeStylePath);

    // add to our list of style relative paths
    modeStyleMeta.cmpRelativePaths.push(componentRelativeStylePath);

  } else {
    // this path is relative to the component
    // add to our list of style relative paths
    modeStyleMeta.cmpRelativePaths.push(componentRelativeStylePath);

    // create the absolute path to the style file
    const absoluteStylePath = normalizePath(config.sys.path.join(componentDir, componentRelativeStylePath));

    // add to our list of style absolute paths
    modeStyleMeta.absolutePaths.push(absoluteStylePath);
  }
}