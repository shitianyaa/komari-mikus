import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const themeConfig = JSON.parse(readFileSync(new URL('komari-theme.json', root), 'utf8'));
const baseCss = readFileSync(new URL('dist/assets/css/base.css', root), 'utf8');

// ── 1. 向后兼容配置键 ─────────────────────────────────────────────
// 这些键直接对应 Komari 里已保存的配置值，改名会让既有站点的设置失效。

const REQUIRED_KEYS = [
    'default_theme', 'default_view', 'show_uptime', 'show_network_speed',
    'show_traffic_tags', 'icon_bounce', 'sakura_enabled', 'preloader_enabled',
    'mascot_enabled', 'mascot_url', 'pc_background_url', 'mobile_background_url',
    'refresh_interval', 'custom_footer'
];

const themeKeys = themeConfig.configuration.data
    .map(function (item) { return item.key; })
    .filter(Boolean);

REQUIRED_KEYS.forEach(function (key) {
    assert.ok(
        themeKeys.indexOf(key) !== -1,
        `komari-theme.json 缺少向后兼容的配置键：${key}`
    );
});

// default_theme 的取值必须仍然包含 system（initTheme 依赖它）
const defaultTheme = themeConfig.configuration.data.find(function (item) {
    return item.key === 'default_theme';
});
assert.ok(defaultTheme, 'komari-theme.json 缺少 default_theme');
assert.match(
    defaultTheme.options,
    /(^|,)system(,|$)/,
    'default_theme 的 options 必须包含 system'
);

// ── 1b. 清单字段必须符合 Komari 的格式要求 ────────────────────────
// 文档规定 short 只能含大小写字母、数字、下划线和连字符，不能为空、
// 不能为 default。写成 "Arona Plana" 这类带空格的值会让主题装不上。

assert.equal(typeof themeConfig.short, 'string', 'komari-theme.json 缺少 short');
assert.ok(themeConfig.short.length > 0, 'short 不能为空');
assert.match(
    themeConfig.short,
    /^[A-Za-z0-9_-]+$/,
    `short 只能包含字母、数字、下划线和连字符：${themeConfig.short}`
);
assert.notEqual(
    themeConfig.short.toLowerCase(),
    'default',
    'short 不能为 default'
);

assert.ok(themeConfig.name, 'komari-theme.json 缺少 name');
assert.match(
    String(themeConfig.version),
    /^\d+\.\d+\.\d+/,
    `version 应为语义化版本：${themeConfig.version}`
);

// ── 2. preview 指向的文件必须存在 ─────────────────────────────────
// release.yml 会 grep 这个字段去复制预览图，名字写错会导致打包缺图。

assert.ok(themeConfig.preview, 'komari-theme.json 缺少 preview');
assert.ok(
    existsSync(new URL(themeConfig.preview, root)),
    `preview 指向的文件不存在：${themeConfig.preview}`
);

// ── 3. --*-rgb 变量必须是 "R, G, B" 逗号格式 ──────────────────────
// 使用处写作 rgba(var(--x-rgb), a)。格式写错（空格分隔或 hex）
// 会让整条声明静默失效并降级为 transparent，极难排查。

const rgbDeclarations = baseCss.match(/--[\w-]*-rgb\s*:\s*([^;]+);/g) || [];
assert.ok(rgbDeclarations.length > 0, 'base.css 中未找到任何 --*-rgb 变量');

rgbDeclarations.forEach(function (declaration) {
    const value = declaration.split(':')[1].replace(';', '').trim();
    assert.match(
        value,
        /^\d{1,3},\s*\d{1,3},\s*\d{1,3}$/,
        `--*-rgb 变量格式必须是 "R, G, B"：${declaration}`
    );
});

// ── 4. 浅色块与深色块的变量一致性 ─────────────────────────────────
// 最深色块缺少 --accent-rgb 会让深色主题下的光晕沿用它从 :root
// 继承来的浅色值 —— 正是本次改造前存在的缺陷。

const rootBlock = baseCss.match(/:root\s*\{([^}]*)\}/);
const darkBlock = baseCss.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/);
assert.ok(rootBlock, 'base.css 未找到 :root 变量块');
assert.ok(darkBlock, 'base.css 未找到 [data-theme="dark"] 变量块');

function varNames(block) {
    return new Set(block.match(/--[\w-]+(?=\s*:)/g) || []);
}

const rootVars = varNames(rootBlock[1]);
const darkVars = varNames(darkBlock[1]);

// 深色块可以只覆盖一部分（其余继承），但凡是它定义的，浅色块必须有同名
darkVars.forEach(function (name) {
    assert.ok(
        rootVars.has(name),
        `深色块定义了浅色块没有的变量：${name}`
    );
});

// 这几项必须在深色块里被显式覆盖，否则深色主题会继承浅色取值
['--accent-rgb', '--accent', '--bg-primary', '--text-primary',
    '--border-color-rgb', '--chart-cpu', '--particle-1'].forEach(function (name) {
    assert.ok(
        darkVars.has(name),
        `深色块缺少必要覆盖：${name}`
    );
});

console.log('主题配置与配色变量测试通过');
