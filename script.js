async function generate() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const productName = document.getElementById("productName").value.trim();
  const category = document.getElementById("category").value;
  const price = document.getElementById("price").value.trim();
  const features = document.getElementById("features").value.trim();
  const platform = document.getElementById("platform").value;
  const tone = document.getElementById("tone").value;

  const errorBox = document.getElementById("errorBox");
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const btn = document.getElementById("generateBtn");

  // Reset
  errorBox.className = "error-box";
  results.className = "results";
  document.querySelectorAll('.result-block').forEach(b => {
  b.classList.remove('revealed');
  b.style.opacity = '0';
});

  if (!apiKey)
    return showError("Ingresá tu API key de Anthropic para continuar.");
  if (!productName) return showError("El nombre del producto es obligatorio.");

  // UI: loading
  btn.disabled = true;
  loading.className = "loading visible";

  const prompt = `Sos un experto en copywriting para eCommerce en mercados hispanohablantes (Argentina y Uruguay). Tu estilo es directo, persuasivo y sin relleno — sabés que la gente no lee textos largos.

Producto a trabajar:
- Nombre: ${productName}
${category ? `- Categoría: ${category}` : ""}
${price ? `- Precio: USD ${price}` : ""}
${features ? `- Características: ${features}` : ""}
${platform ? `- Plataforma: ${platform}` : ""}
- Tono: ${tone}

Reglas que debés respetar:
- Nada de frases genéricas como "producto de alta calidad" o "ideal para toda la familia"
- Sin emojis a menos que la plataforma lo justifique
- Foco en el beneficio real, no en características técnicas
- Textos concisos: el comprador decide en segundos
- Lenguaje natural, no de folleto corporativo

Respondé SOLO con un JSON válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "titulo": "título de venta directo y atractivo, máximo 70 caracteres, que comunique el beneficio principal",
  "descripcion_larga": "descripción para listing de 3 a 4 oraciones cortas. Primera oración: el beneficio principal. Segunda: qué lo diferencia o para quién es. Tercera/cuarta: detalle clave o llamado a la acción. Sin bullets, sin listas.",
  "descripcion_corta": "2 oraciones máximo para redes o descripción rápida. Impacto inmediato.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "cta": "call to action de no más de 8 palabras, con urgencia o beneficio claro"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error(
        "La IA respondió en un formato inesperado. Intentá de nuevo.",
      );
    }

    document.getElementById("titleContent").textContent = parsed.titulo || "";
    document.getElementById("descContent").textContent =
      parsed.descripcion_larga || "";
    document.getElementById("shortContent").textContent =
      parsed.descripcion_corta || "";
    document.getElementById("ctaContent").textContent = parsed.cta || "";

    const tagsEl = document.getElementById("tagsContent");
    tagsEl.innerHTML = "";
    (parsed.tags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = tag;
      tagsEl.appendChild(chip);
    });

    results.className = "results visible";

    const blocks = [
      "block-title",
      "block-desc",
      "block-short",
      "block-tags",
      "block-cta",
    ];
    blocks.forEach((id, i) => {
      setTimeout(() => {
        document.getElementById(id).classList.add("revealed");
      }, i * 90);
    });

    setTimeout(() => {
      results.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  } catch (err) {
    showError(err.message || "Ocurrió un error inesperado.");
  } finally {
    loading.className = "loading";
    btn.disabled = false;
  }
}

function showError(msg) {
  const errorBox = document.getElementById("errorBox");
  errorBox.textContent = "⚠ " + msg;
  errorBox.className = "error-box visible";
  document.getElementById("loading").className = "loading";
  document.getElementById("generateBtn").disabled = false;
}

function copyBlock(id, btn) {
  const el = document.getElementById(id);
  let text = "";
  if (el.classList.contains("tags-list")) {
    text = Array.from(el.querySelectorAll(".tag-chip"))
      .map((c) => c.textContent)
      .join(", ");
  } else {
    text = el.textContent;
  }
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = "✓ Copiado";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("copied");
    }, 2000);
  });
}

function copyAll() {
  const title = document.getElementById("titleContent").textContent;
  const desc = document.getElementById("descContent").textContent;
  const short = document.getElementById("shortContent").textContent;
  const tags = Array.from(document.querySelectorAll(".tag-chip"))
    .map((c) => c.textContent)
    .join(", ");
  const cta = document.getElementById("ctaContent").textContent;
  const all = `TÍTULO:\n${title}\n\nDESCRIPCIÓN:\n${desc}\n\nDESCRIPCIÓN CORTA:\n${short}\n\nTAGS: ${tags}\n\nCTA:\n${cta}`;
  navigator.clipboard.writeText(all).then(() => {
    const btn = document.querySelector(".btn-copy-all");
    btn.textContent = "✓ Todo copiado";
    setTimeout(() => (btn.textContent = "Copiar todo"), 2000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("productName").addEventListener("keydown", (e) => {
    if (e.key === "Enter") generate();
  });
});
