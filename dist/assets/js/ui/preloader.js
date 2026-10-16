/**
 * @module ui/preloader
 * @description 预加载器进度模拟 + 时间问候更新
 * @dependencies core/state.js, i18n/index.js
 * @exports startPreloaderSimulation, updatePreloader, hidePreloader, updateTime, updateGreetingSubtitle, clearPreloaderTimer, getPreloaderProgress
 */

import { state } from '../core/state.js';
import { i18n, t, tr } from '../i18n/index.js';

/** 模块私有：预加载器当前进度 */
let preloaderProgress = 0;

/** 模块私有：预加载器定时器引用 */
let preloaderTimer = null;

/**
 * 更新顶部时间显示和问候语
 */
export function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = '';

    if (hours >= 5 && hours < 12) {
        greeting = i18n[state.currentLang] && i18n[state.currentLang].good_morning ? i18n[state.currentLang].good_morning : '早上好';
    } else if (hours >= 12 && hours < 18) {
        greeting = i18n[state.currentLang] && i18n[state.currentLang].good_afternoon ? i18n[state.currentLang].good_afternoon : '下午好';
    } else {
        greeting = i18n[state.currentLang] && i18n[state.currentLang].good_evening ? i18n[state.currentLang].good_evening : '晚上好';
    }

    const greetingEl = document.getElementById('greetingText');
    if (greetingEl) greetingEl.textContent = greeting;

    updateGreetingSubtitle();

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateStr = now.toLocaleDateString(state.currentLang === 'zh-CN' ? 'zh-CN' : 'en-US', dateOptions);
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.textContent = dateStr;

    const timeStr = now.toLocaleTimeString(state.currentLang === 'zh-CN' ? 'zh-CN' : 'en-US', { hour12: false });
    const timeEl = document.getElementById('currentTime');
    if (timeEl) timeEl.textContent = timeStr;
}

/**
 * 根据节点在线状态更新欢迎区副标题
 */
export function updateGreetingSubtitle() {
    const subtitleEl = document.querySelector('.greeting-subtitle');
    if (!subtitleEl) return;

    const total = state.nodes.length;
    const online = state.onlineNodes.length;
    const offline = total - online;

    let message = '';

    if (total === 0) {
        message = tr('welcome_loading');
    } else if (offline === 0) {
        message = tr('welcome_ok');
    } else if (online === 0) {
        message = tr('welcome_down');
    } else if (offline <= Math.floor(total * 0.3)) {
        message = tr('welcome_partial', { n: offline });
    } else {
        message = tr('welcome_major', { n: offline, total: total });
    }

    subtitleEl.textContent = message;
}

/**
 * 更新预加载器进度
 * @param {number} progress - 进度百分比 0-100
 * @param {string} [statusText] - 状态文字
 */
export function updatePreloader(progress, statusText) {
    const fillEl = document.getElementById('progressFill');
    const textEl = document.getElementById('progressText');
    const statusEl = document.getElementById('preloaderStatus');
    if (fillEl) fillEl.style.width = progress + '%';
    if (textEl) textEl.textContent = Math.round(progress) + '%';
    if (statusEl && statusText) statusEl.textContent = statusText;
    preloaderProgress = progress;
}

/**
 * 隐藏预加载器
 */
export function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    updatePreloader(100, t('preloader_complete'));
    setTimeout(function () {
        preloader.classList.add('fade-out');
        setTimeout(function () {
            preloader.classList.add('hidden');
        }, 600);
    }, 300);
}

/**
 * 启动预加载器进度模拟
 */
export function startPreloaderSimulation() {
    clearPreloaderTimer();
    // 先按当前语言重置初始文案，避免非中文用户在首次 tick 前看到 HTML 里的中文
    updatePreloader(preloaderProgress, t('preloader_loading'));
    const stages = [
        { target: 20, text: t('preloader_styles') },
        { target: 40, text: t('preloader_config') },
        { target: 60, text: t('preloader_nodes') },
        { target: 80, text: t('preloader_connect') },
        { target: 90, text: t('preloader_init') }
    ];
    let stageIndex = 0;
    preloaderTimer = setInterval(function () {
        if (stageIndex >= stages.length) {
            clearInterval(preloaderTimer);
            return;
        }
        const stage = stages[stageIndex];
        if (preloaderProgress < stage.target) {
            updatePreloader(preloaderProgress + 1, stage.text);
        } else {
            stageIndex++;
        }
    }, 80);
}

/**
 * 清理预加载器定时器
 */
export function clearPreloaderTimer() {
    if (preloaderTimer) {
        clearInterval(preloaderTimer);
        preloaderTimer = null;
    }
}

/**
 * 获取预加载器当前进度
 * @returns {number} 当前进度百分比 0-100
 */
export function getPreloaderProgress() {
    return preloaderProgress;
}
