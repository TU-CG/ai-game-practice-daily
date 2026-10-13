"use strict";
const state = { index: null, tag: "all", query: "", page: 1, pageSize: 5, active: null, collapsed: false, request: 0 };
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeUrl = value => { try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
const stored = () => { try { return localStorage.getItem("ai-game-practice-last-viewed"); } catch { return null; } };
const remember = date => { try { localStorage.setItem("ai-game-practice-last-viewed", date); } catch { /* optional */ } };
const tag = id => state.index.tags.find(t => t.id === id);
const color = id => /^#[0-9a-f]{6}$/i.test(tag(id)?.color || "") ? tag(id).color : "#0d7f8a";
const label = id => tag(id)?.label || id;
const tagHtml = id => `<span class="topic-label" style="--tag-color:${color(id)}">${esc(label(id))}</span>`;

// A small, escaped Markdown subset: prose, headings, lists, tables, links, and fences.
function inline(text) {
  return String(text).split(/(`[^`\n]+`)/g).map(part => {
    if (part.startsWith("`") && part.endsWith("`")) return `<code>${esc(part.slice(1, -1))}</code>`;
    return esc(part).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }).join("");
}
function markdown(value) {
  const lines = String(value || "").replace(/\r/g, "").split("\n");
  const output = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].trim()) { i++; continue; }
    const fence = lines[i].match(/^```([^\s`]*)\s*$/);
    if (fence) {
      const code = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      output.push(`<div class="code-block"><div class="code-bar"><span>${esc(fence[1] || "TEXT")}</span><button type="button" class="copy-code">复制</button></div><pre><code>${esc(code.join("\n"))}</code></pre></div>`);
      continue;
    }
    if (i + 1 < lines.length && lines[i].includes("|") && /^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[i + 1])) {
      const cells = line => line.trim().replace(/^\||\|$/g, "").split("|").map(cell => inline(cell.trim()));
      const headers = cells(lines[i]); i += 2; const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) rows.push(cells(lines[i++]));
      output.push(`<div class="table-scroll"><table><thead><tr>${headers.map(c => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    const heading = lines[i].match(/^#{1,4}\s+(.+)$/);
    if (heading) { output.push(`<h3>${inline(heading[1])}</h3>`); i++; continue; }
    const list = lines[i].match(/^(\d+\.|-)\s+/);
    if (list) {
      const ordered = list[1] !== "-", expression = ordered ? /^\d+\.\s+/ : /^-\s+/;
      const items = [];
      while (i < lines.length && expression.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(expression, ""))}</li>`);
      const type = ordered ? "ol" : "ul";
      output.push(`<${type}>${items.join("")}</${type}>`); continue;
    }
    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !/^```|^#{1,4}\s|^(?:\d+\.|-)\s/.test(lines[i])) paragraph.push(lines[i++]);
    if (!paragraph.length) paragraph.push(lines[i++]);
    output.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
  }
  return output.join("");
}
function filtered() {
  const query = state.query.trim().toLowerCase();
  return state.index.reports.filter(r => (state.tag === "all" || r.tags.includes(state.tag)) &&
    (!query || [r.date, r.title, r.summary, ...r.tags.map(label)].join(" ").toLowerCase().includes(query)));
}
function setUrl(date, replace = false) {
  const url = new URL(location.href);
  url.search = date ? `?date=${encodeURIComponent(date)}` : "";
  url.hash = date ? "article" : "";
  history[replace ? "replaceState" : "pushState"](null, "", url);
}
function renderList() {
  const reports = filtered(), pages = Math.max(1, Math.ceil(reports.length / state.pageSize));
  state.page = Math.max(1, Math.min(state.page, pages));
  $("#report-count").textContent = `${reports.length} 篇`;
  $("#total-pages").textContent = pages;
  $("#page-input").value = state.page;
  $("#page-input").max = pages;
  $("#page-input").disabled = pages === 1;
  $("#prev-page").disabled = state.page === 1;
  $("#next-page").disabled = state.page === pages;
  const viewed = stored();
  $("#report-list").innerHTML = reports.slice((state.page - 1) * state.pageSize, state.page * state.pageSize).map(r => `
    <article class="report-card ${viewed === r.date ? "last-viewed" : ""}" data-date="${esc(r.date)}" tabindex="0" role="button" aria-label="阅读 ${esc(r.title)}">
      <div class="card-top"><div class="card-date-wrap">${viewed === r.date ? '<span class="last-viewed-mark">上次阅读</span>' : ""}<time class="report-date" datetime="${esc(r.date)}">${esc(r.date)}</time></div></div>
      <h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><div class="topic-labels">${r.tags.map(tagHtml).join("")}</div>
    </article>`).join("") || '<p class="empty-state">这个分类还没有文章，或没有匹配的搜索结果。试试“全部”。</p>';
  $("#report-list").querySelectorAll(".report-card").forEach(card => {
    const open = () => openArticle(state.index.reports.find(r => r.date === card.dataset.date));
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); open(); } });
  });
}
function renderFilters() {
  $("#category-filters").innerHTML = [{id: "all", label: "全部", icon: "全"}, ...state.index.tags].map(t =>
    `<button type="button" class="rail-tab ${state.tag === t.id ? "active" : ""}" aria-pressed="${state.tag === t.id}" data-tag="${esc(t.id)}" style="--category-color:${color(t.id)}"><span class="rail-tab-icon" aria-hidden="true">${esc(t.icon || t.label.slice(0,1))}</span><span class="rail-tab-label">${esc(t.label)}</span></button>`).join("");
  $("#category-filters").querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    state.tag = button.dataset.tag; state.page = 1; state.collapsed = false; setUrl(null); render();
  }));
}
function syncView() {
  $("#list-panel").classList.toggle("collapsed", state.collapsed);
  $("#article-content").hidden = !state.collapsed;
  $("#collapsed-title").textContent = state.active?.title || "";
  $("#list-toggle").textContent = state.collapsed ? "展开列表 ⌄" : "继续阅读 ↑";
  $("#list-toggle").disabled = !state.collapsed && !filtered().length;
  $("#list-toggle").setAttribute("aria-expanded", String(!state.collapsed));
  document.title = state.collapsed && state.active ? `${state.active.title} · AI 游戏应用实战日报` : "AI 游戏应用实战日报";
}
function render() { renderFilters(); renderList(); syncView(); }
async function openArticle(report, updateUrl = true) {
  if (!report) return;
  const request = ++state.request;
  state.active = report; state.collapsed = true; remember(report.date);
  if (updateUrl) setUrl(report.date);
  render();
  const reader = $("#article-content");
  reader.innerHTML = '<p class="empty-state">正在打开文章……</p>';
  try {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(report.file)) throw new Error("Invalid filename");
    const response = await fetch(`data/${report.file}`, { cache: "no-cache" });
    if (!response.ok) throw new Error("Article unavailable");
    const a = await response.json();
    if (request !== state.request) return;
    if (!Array.isArray(a.sections) || !Array.isArray(a.sources)) throw new Error("Invalid article format");
    reader.innerHTML = `<div class="article-meta">${a.tags.map(tagHtml).join("")}<time datetime="${esc(a.date)}">${esc(a.date)}</time><span>${esc(a.readingMinutes || 6)} 分钟阅读</span><span class="stage-label">${esc(a.stage || "实用方法")}</span></div>
      <h1 class="article-title" tabindex="-1">${esc(a.title)}</h1><p class="article-summary">${inline(a.summary)}</p>
      <p class="article-scope">适用范围：${esc(a.scope)}</p>
      ${a.sections.map(s => `<section class="article-section"><h2>${esc(s.heading)}</h2>${markdown(s.body)}</section>`).join("")}
      <section class="article-section"><h2>来源与继续阅读</h2><ul class="source-list">${a.sources.map(s => `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join("")}</ul></section>
      <div class="article-footer"><button type="button" class="list-toggle back-to-list">返回文章列表</button><a href="https://github.com/TU-CG/ai-game-practice-daily/blob/main/data/${report.file}" target="_blank" rel="noopener noreferrer">查看本期源文件 ↗</a></div>`;
    reader.querySelector(".back-to-list").addEventListener("click", showList);
    reader.querySelectorAll(".copy-code").forEach(button => button.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(button.closest(".code-block").querySelector("code").textContent); button.textContent = "已复制"; }
      catch { button.textContent = "请选中代码复制"; }
    }));
    reader.querySelector("h1").focus({preventScroll:true});
    $("#list-panel").scrollIntoView({behavior:"smooth", block:"start"});
  } catch {
    if (request === state.request) reader.innerHTML = '<p class="empty-state">文章暂时无法加载。请刷新重试，或展开列表阅读其他文章。</p>';
  }
}
function showList() { state.collapsed = false; setUrl(null); render(); $("#list-panel").scrollIntoView({behavior:"smooth"}); }
function jumpPage() { const number = parseInt($("#page-input").value, 10); if (Number.isFinite(number)) state.page = number; renderList(); }
async function start() {
  const response = await fetch("data/reports.json", {cache:"no-cache"});
  if (!response.ok) throw new Error("Index unavailable");
  state.index = await response.json();
  state.index.reports.sort((a,b) => b.date.localeCompare(a.date));
  $("#search-input").addEventListener("input", event => { state.query = event.target.value; state.page = 1; state.collapsed = false; if (location.search) setUrl(null, true); render(); });
  $("#list-toggle").addEventListener("click", () => state.collapsed ? showList() : openArticle(filtered().find(r => r.date === state.active?.date) || filtered()[0]));
  $("#prev-page").addEventListener("click", () => { state.page--; renderList(); });
  $("#next-page").addEventListener("click", () => { state.page++; renderList(); });
  $("#page-input").addEventListener("change", jumpPage);
  $("#page-input").addEventListener("keydown", e => { if (e.key === "Enter") jumpPage(); });
  const route = () => {
    const date = new URLSearchParams(location.search).get("date");
    const found = state.index.reports.find(r => r.date === date);
    if (found) openArticle(found, false);
    else { state.collapsed = false; render(); if (date) $("#report-list").insertAdjacentHTML("afterbegin", '<p class="empty-state">未找到该日期的文章，以下是已有日报。</p>'); }
  };
  window.addEventListener("popstate", route); route();
}
start().catch(() => { $("#report-list").innerHTML = '<p class="empty-state">文章目录暂时无法加载，请稍后刷新。</p>'; });
