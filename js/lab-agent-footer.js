/**
 * Lab agent footer — MCP one-liners + for-ai deep link (P2 crawl rec).
 * Auto-mounts a strip at end of <main> or body when data-lab-agent-footer is set
 * or when path matches /labs/ or /dojo/.
 */
(function () {
  "use strict";
  if (document.documentElement.hasAttribute("data-no-lab-agent-footer")) return;

  function pathOk() {
    var p = location.pathname || "";
    return (
      p.indexOf("/labs/") === 0 ||
      p.indexOf("/dojo") === 0 ||
      p.indexOf("/for-ai") === 0 ||
      document.body.hasAttribute("data-lab-agent-footer")
    );
  }

  function mount() {
    if (!pathOk()) return;
    if (document.getElementById("lab-agent-footer")) return;
    var el = document.createElement("aside");
    el.id = "lab-agent-footer";
    el.setAttribute("data-section", "lab-agent-footer");
    el.setAttribute("aria-label", "Agent MCP");
    el.innerHTML =
      '<div class="lab-agent-footer-inner">' +
      "<strong>Agents</strong> · " +
      '<a href="/for-ai#declaration-lab">for-ai#declaration-lab</a> · ' +
      '<code>kbatch_lettergrid_ping</code> · ' +
      '<code>kbatch_concept_solve</code> · ' +
      '<a href="/api/mcp" target="_blank" rel="noopener">/api/mcp</a> · ' +
      '<button type="button" class="btn" id="lab-agent-copy-mcp" style="font-size:0.75rem;padding:2px 8px">Copy MCP JSON</button>' +
      "</div>";
    el.style.cssText =
      "margin:1.25rem auto 2rem;max-width:min(1100px,100%);padding:0 1rem;font-size:0.78rem;opacity:0.9";
    var main = document.querySelector("main") || document.body;
    main.appendChild(el);
    var btn = document.getElementById("lab-agent-copy-mcp");
    if (btn) {
      btn.addEventListener("click", function () {
        var snippet = JSON.stringify(
          {
            mcpServers: {
              kbatch: {
                url: "https://kbatch.ugrad.ai/api/mcp",
                transport: "http",
              },
            },
          },
          null,
          2
        );
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(snippet).then(function () {
            btn.textContent = "Copied";
            setTimeout(function () {
              btn.textContent = "Copy MCP JSON";
            }, 1500);
          });
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
