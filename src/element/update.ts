import { ComponentController, ComponentMeta, ProxyElement } from '../utils/interfaces';
import { PlatformApi } from '../platform/platform-api';
import { Config } from '../utils/config';
import { generateVNode } from './host';
import { initState } from './proxy';
import { Renderer } from '../utils/interfaces';
import { getModuleId, isUndef } from '../utils/helpers';


export function queueUpdate(plt: PlatformApi, config: Config, renderer: Renderer, elm: ProxyElement, ctrl: ComponentController, cmpMeta: ComponentMeta) {
  // only run patch if it isn't queued already
  if (!ctrl.queued) {
    ctrl.queued = true;

    // run the patch in the next tick
    plt.nextTick(function nextUpdate() {

      // vdom diff and patch the host element for differences
      update(plt, config, renderer, elm, ctrl, cmpMeta);

      // no longer queued
      ctrl.queued = false;
    });
  }
}


export function update(plt: PlatformApi, config: Config, renderer: Renderer, elm: ProxyElement, ctrl: ComponentController, cmpMeta: ComponentMeta) {
  let instance = ctrl.instance;
  if (isUndef(instance)) {
    instance = ctrl.instance = new cmpMeta.module();
    initState(plt, config, renderer, elm, ctrl, cmpMeta);
  }

  if (isUndef(ctrl.root)) {
    const cmpMode = cmpMeta.modes[instance.mode];

    if (elm.attachShadow) {
      ctrl.root = elm.attachShadow({ mode: 'open' });

      if (cmpMode) {
        const shadowStyleEle = <HTMLStyleElement>plt.createElement('style');
        shadowStyleEle.innerHTML = cmpMode.styles;
        ctrl.root.appendChild(shadowStyleEle);
      }

    } else {
      ctrl.root = elm;

      const moduleId = getModuleId(cmpMeta.tag, instance.mode);
      if (!plt.hasCss(moduleId)) {
        const headStyleEle = <HTMLStyleElement>plt.createElement('style');
        headStyleEle.dataset['moduleId'] = moduleId;
        headStyleEle.innerHTML = cmpMode.styles.replace(/\:host\-context\((.*?)\)|:host\((.*?)\)|\:host/g, '__h');
        plt.appendChild(plt.getDocumentHead(), headStyleEle);
        plt.setCss(moduleId);
      }
    }
  }

  const vnode = generateVNode(ctrl.root, instance, cmpMeta);

  // if we already have a vnode then use it
  // otherwise, elm is the initial patch and
  // we need it to pass it the actual host element
  ctrl.vnode = renderer(ctrl.vnode ? ctrl.vnode : elm, vnode);

  if (isUndef(ctrl.connected)) {
    instance.connectedCallback && instance.connectedCallback();
    ctrl.connected = true;
  }
}