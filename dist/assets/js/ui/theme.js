/**
 * @module ui/theme
 * @description 主题切换、视图切换、语言切换、主题设置应用（footer/mascot/background/particles）
 * @dependencies core/state.js, core/constants.js, i18n/index.js, ui/preloader.js, ui/nodes.js, utils/helpers.js
 * @exports initTheme, applyTheme, toggleTheme, toggleLang, initView, applyView, setView, applyThemeSettings, applyBackgroundSettings, applyParticles
 */

import { state } from '../core/state.js';
import { THEME_MAP, VIEW_MAP } from '../core/constants.js';
import { applyLang } from '../i18n/index.js';
import { clearPreloaderTimer } from './preloader.js';
import { renderAll } from './nodes.js';
import { isMobileDevice } from '../utils/helpers.js';

/** 模块私有：matchMedia 监听器是否已绑定（initTheme 会被调用两次，避免重复注册） */
let themeListenerBound = false;

/**
 * 初始化主题
 * @param {boolean} [useConfigDefault] - 是否采用主题配置里的 default_theme。
 *   首次调用传 false（此时 RPC 尚未返回，配置还拿不到，结果与 <head> 内联脚本一致）；
 *   配置加载完成后以 true 再调一次，仅在访客无 localStorage 偏好时生效。
 */
export function initTheme(useConfigDefault) {
    const saved = localStorage.getItem('appearance');
    let preferred = 'system';

    if (useConfigDefault && state.themeSettings.default_theme) {
        preferred = THEME_MAP[state.themeSettings.default_theme] || state.themeSettings.default_theme;
    }

    let theme = saved || preferred;
    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    state.currentTheme = theme;
    applyTheme(theme);

    if (!themeListenerBound) {
        themeListenerBound = true;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            const saved = localStorage.getItem('appearance');
            if (!saved || saved === 'system') {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

/**
 * 应用主题到页面
 * @param {string} theme - 'dark' 或 'light'
 */
export function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    // 直接读 CSS 变量，避免与 base.css 里的配色各维护一份
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg || (theme === 'dark' ? '#0d0812' : '#f2f8fc'));
}

/**
 * 切换主题（明暗互换）
 */
export function toggleTheme() {
    const next = state.currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('appearance', next);
}

/**
 * 切换语言（中文 → 英文 → 日本語 循环）并重新渲染页面
 */
export function toggleLang() {
    const langOrder = ['zh-CN', 'en', 'ja'];
    const currentIndex = langOrder.indexOf(state.currentLang);
    state.currentLang = langOrder[(currentIndex + 1) % langOrder.length];
    localStorage.setItem('i18nextLng', state.currentLang);
    applyLang();
    renderAll();
}

/**
 * 初始化视图模式（读取 localStorage 或配置默认值）
 */
export function initView() {
    const saved = localStorage.getItem('nodeViewMode');
    const configDefault = state.themeSettings.default_view;
    const mappedDefault = configDefault ? (VIEW_MAP[configDefault] || configDefault) : 'grid';
    state.currentView = saved || mappedDefault;
    applyView();
}

/**
 * 应用视图模式到页面（网格/表格）
 */
export function applyView() {
    const grid = document.getElementById('nodesGrid');
    const table = document.getElementById('nodesTableContainer');
    const btns = document.querySelectorAll('.view-btn');

    if (state.currentView === 'grid') {
        if (grid) grid.style.display = '';
        if (table) table.style.display = 'none';
        document.body.classList.remove('view-table');
        document.body.classList.add('view-grid');
    } else {
        if (grid) grid.style.display = 'none';
        if (table) table.style.display = '';
        document.body.classList.remove('view-grid');
        document.body.classList.add('view-table');
    }

    btns.forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-view') === state.currentView);
    });
}

/**
 * 设置视图模式并持久化
 * @param {string} view - 'grid' 或 'table'
 */
export function setView(view) {
    state.currentView = view;
    localStorage.setItem('nodeViewMode', view);
    applyView();
}

/**
 * 应用主题设置（footer/mascot/preloader/background/particles）
 */
export function applyThemeSettings() {
    const customFooter = state.themeSettings.custom_footer;
    const footerEl = document.getElementById('customFooter');
    if (footerEl && customFooter) {
        footerEl.textContent = customFooter;
    }

    const iconBounce = state.themeSettings.icon_bounce !== false;
    const greetingIcon = document.querySelector('.greeting-icon');
    if (greetingIcon) {
        if (!iconBounce) {
            greetingIcon.classList.add('no-bounce');
        } else {
            greetingIcon.classList.remove('no-bounce');
        }

        const mascotEnabled = state.themeSettings.mascot_enabled !== false;
        const mascotUrl = state.themeSettings.mascot_url || '';
        const welcomeGreeting = document.querySelector('.welcome-greeting');
        if (!mascotEnabled) {
            greetingIcon.style.display = 'none';
            if (welcomeGreeting) welcomeGreeting.classList.add('no-mascot');
        } else {
            greetingIcon.style.display = '';
            if (welcomeGreeting) welcomeGreeting.classList.remove('no-mascot');
            if (mascotUrl) {
                const lightSlot = greetingIcon.querySelector('.mascot-light');
                if (lightSlot) lightSlot.src = mascotUrl;
                greetingIcon.classList.add('has-custom-mascot');
            } else {
                greetingIcon.classList.remove('has-custom-mascot');
            }
        }
    }

    const preloaderEnabled = state.themeSettings.preloader_enabled !== false;
    if (!preloaderEnabled) {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            clearPreloaderTimer();
        }
    }

    applyBackgroundSettings();
    applyParticles();
}

/**
 * 应用背景设置（图片/视频，区分 PC/移动端）
 */
export function applyBackgroundSettings() {
    const isMobile = isMobileDevice();
    const prefix = isMobile ? 'mobile_' : 'pc_';

    let bgUrl = state.themeSettings[prefix + 'background_url'];
    if (bgUrl === undefined || bgUrl === null) {
        bgUrl = state.themeSettings.background_url || '';
    }

    const bgType = bgUrl ? 'custom' : 'none';

    const root = document.documentElement;
    root.style.setProperty('--custom-card-alpha', '0.85');

    if (bgType !== 'none') {
        document.body.classList.add('has-custom-background');
    } else {
        document.body.classList.remove('has-custom-background');
    }

    let bgContainer = document.getElementById('customBackground');
    if (!bgContainer) {
        bgContainer = document.createElement('div');
        bgContainer.id = 'customBackground';
        bgContainer.className = 'custom-background hidden';
        document.body.insertBefore(bgContainer, document.body.firstChild);
    }

    const existingVideo = bgContainer.querySelector('video');
    if (existingVideo) {
        existingVideo.pause();
        existingVideo.remove();
    }

    bgContainer.className = 'custom-background';
    bgContainer.style.backgroundImage = '';

    if (bgType === 'none') {
        bgContainer.classList.add('hidden');
    } else if (bgType === 'custom' && bgUrl) {
        const isVideo = /\.(webm|mp4|ogg|mov)(\?.*)?$/i.test(bgUrl);

        if (isVideo) {
            bgContainer.classList.remove('hidden');
            const video = document.createElement('video');
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.src = bgUrl;
            bgContainer.appendChild(video);
            video.play().catch(function() {});
        } else {
            bgContainer.classList.remove('hidden');
            bgContainer.style.backgroundImage = 'url(' + bgUrl + ')';
        }
    }

    bgContainer.style.opacity = '1';
}

/**
 * 应用电子粒子特效（根据配置动态加载/移除 particles.js）
 * 配置键沿用历史的 sakura_enabled，改名会让已部署站点的既有设置失效。
 */
export function applyParticles() {
    const particlesEnabled = state.themeSettings.sakura_enabled !== false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const script = document.getElementById('particle-script');

    if (particlesEnabled && !reducedMotion && !script) {
        const el = document.createElement('script');
        el.id = 'particle-script';
        el.type = 'text/javascript';
        el.src = './assets/js/particles.js';
        document.body.appendChild(el);
    } else if ((!particlesEnabled || reducedMotion) && script) {
        if (window.__particles && typeof window.__particles.destroy === 'function') {
            window.__particles.destroy();
        }
        script.remove();
        const canvas = document.getElementById('particle-canvas');
        if (canvas) canvas.remove();
    }
}
