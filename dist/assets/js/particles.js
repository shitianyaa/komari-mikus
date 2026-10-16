/**
 * @module particles
 * @description 电子粒子 / 光点背景特效（替代原樱花飘落）
 * @dependencies 无（颜色从 --particle-* CSS 变量读取）
 *
 * 由 ui/theme.js 的 applyParticles() 按需注入。非 ES module：
 * 通过 window.__particles 暴露 destroy() 供关闭特效时清理。
 */
(function () {
    'use strict';

    /** 粒子数上限，避免大屏下过密 */
    const MAX_PARTICLES = 90;
    /** 粒子数下限，避免小屏下过稀 */
    const MIN_PARTICLES = 24;
    /** 每多少平方像素一个粒子 */
    const DENSITY_DIVISOR = 18000;
    /** 设备像素比上限，防止 3x 屏显存爆掉 */
    const MAX_DPR = 2;

    let canvas = null;
    let ctx = null;
    let particles = [];
    let colors = [];
    let rafId = null;
    let running = false;
    let observer = null;

    /**
     * 从 CSS 变量读取粒子配色（随主题切换）
     */
    function refreshColors() {
        const cs = getComputedStyle(document.documentElement);
        const pick = function (name, fallback) {
            return cs.getPropertyValue(name).trim() || fallback;
        };
        colors = [
            pick('--particle-1', '#8fd8f0'),
            pick('--particle-2', '#38bdf8'),
            pick('--particle-3', '#ffffff')
        ];
    }

    /**
     * 按视口面积计算目标粒子数
     * @returns {number}
     */
    function targetCount() {
        const n = Math.round((window.innerWidth * window.innerHeight) / DENSITY_DIVISOR);
        return Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, n));
    }

    /**
     * 生成一个粒子
     * @param {number} w - 视口宽
     * @param {number} h - 视口高
     * @param {boolean} fromBottom - 是否从下方向上补入
     * @returns {object}
     */
    function spawn(w, h, fromBottom) {
        return {
            x: Math.random() * w,
            y: fromBottom ? h + Math.random() * h * 0.15 : Math.random() * h,
            r: 0.7 + Math.random() * 1.9,
            vy: 0.12 + Math.random() * 0.42,
            vx: (Math.random() - 0.5) * 0.18,
            alpha: 0.25 + Math.random() * 0.55,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    /**
     * 重设画布尺寸并同步粒子数量
     */
    function resize() {
        if (!canvas || !ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const want = targetCount();
        while (particles.length < want) particles.push(spawn(w, h, false));
        if (particles.length > want) particles.length = want;
    }

    /**
     * 单帧绘制
     */
    function frame() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y -= p.vy;
            p.x += p.vx;
            p.phase += 0.02;

            if (p.y < -8) {
                particles[i] = spawn(w, h, true);
                continue;
            }
            if (p.x < -8) {
                p.x = w + 8;
            } else if (p.x > w + 8) {
                p.x = -8;
            }

            ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.phase));
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function onVisibility() {
        if (document.hidden) {
            stop();
        } else {
            start();
        }
    }

    /**
     * 移除画布、取消动画、解绑所有监听
     */
    function destroy() {
        stop();
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        canvas = null;
        ctx = null;
        particles = [];
        colors = [];
        delete window.__particles;
    }

    function init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:10000;';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        refreshColors();
        resize();

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVisibility);

        // 主题切换时立即重着色，与 applyTheme() 零耦合
        observer = new MutationObserver(function () {
            refreshColors();
            for (let i = 0; i < particles.length; i++) {
                particles[i].color = colors[i % colors.length];
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        start();
        window.__particles = { destroy: destroy };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
