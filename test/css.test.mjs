import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const cssDir = new URL('../dist/assets/css/', import.meta.url);
const css = readFileSync(new URL('stats.css', cssDir), 'utf8');

function ruleBody(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
    assert.ok(match, `未找到 CSS 规则：${selector}`);
    return match[1];
}

const groupFilterRule = ruleBody('.group-filter');

assert.match(groupFilterRule, /overflow-x\s*:\s*auto\s*;/, '分组过多时应允许横向滚动');
assert.match(groupFilterRule, /flex-wrap\s*:\s*nowrap\s*;/, '分组按钮应保持单行');
assert.match(groupFilterRule, /scrollbar-width\s*:\s*none\s*;/, '应隐藏 Firefox 滚动条');
assert.match(css, /\.group-filter::?-webkit-scrollbar\s*\{[^}]*display\s*:\s*none\s*;/s, '应隐藏 WebKit 滚动条');
assert.match(css, /\.group-filter\s+\.filter-btn\s*\{[^}]*flex\s*:\s*0\s+0\s+auto\s*;/s, '分组按钮不应被压缩');

// ── 主题改造遗留检查 ──────────────────────────────────────────────

const cssFiles = readdirSync(cssDir).filter(function (name) {
    return name.endsWith('.css');
});

// 原先散落在 10 处的硬编码粉色字面量应已全部变量化为 rgba(var(--accent-rgb), ...)
cssFiles.forEach(function (name) {
    const content = readFileSync(new URL(name, cssDir), 'utf8');
    assert.ok(
        content.indexOf('232, 102, 138') === -1,
        `${name} 仍含硬编码粉色字面量 rgba(232, 102, 138, ...)`
    );
});

// --sakura-* 已改名 --deco-*，不应有残留引用
cssFiles.forEach(function (name) {
    const content = readFileSync(new URL(name, cssDir), 'utf8');
    assert.ok(
        content.indexOf('--sakura-') === -1,
        `${name} 仍含已改名的 --sakura-* 变量`
    );
});

// 双形态切换规则必须存在，否则两张吉祥物会同时显示
const baseCss = readFileSync(new URL('base.css', cssDir), 'utf8');
assert.match(
    baseCss,
    /\[data-theme="dark"\]\s+\.mascot-light\s*\{[^}]*display\s*:\s*none/,
    'base.css 缺少深色主题隐藏 .mascot-light 的规则'
);
assert.match(
    baseCss,
    /\[data-theme="dark"\]\s+\.mascot-dark\s*\{[^}]*display\s*:\s*block/,
    'base.css 缺少深色主题显示 .mascot-dark 的规则'
);
assert.match(
    baseCss,
    /\.mascot\s*\{[^}]*\}/,
    'base.css 缺少 .mascot 基础规则'
);
// .mascot 不得设 display —— 否则与 .mascot-dark 特异性相同且更靠后，
// 会盖掉它的 display:none 导致浅色下两张图同时渲染
const mascotRule = baseCss.match(/\.mascot\s*\{([^}]*)\}/);
assert.ok(
    !/display\s*:/.test(mascotRule[1]),
    '.mascot 不得声明 display，否则会覆盖 .mascot-light/.mascot-dark 的显示控制'
);

console.log('分组筛选栏横向滚动与主题改造遗留检查测试通过');
