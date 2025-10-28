import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// --- Configuration ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWS_FILE = path.join(__dirname, "../content/news.md");
const STATIC_DIR = path.join(__dirname, "../static/news");

// --- Utility helpers ---
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function fetchOGImage(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (match) return match[1];
  } catch (err) {
    console.warn("⚠️ Failed to fetch OG image:", url, err.message);
  }
  return null;
}

async function downloadImage(url, title) {
  try {
    const ext = path.extname(url.split("?")[0]) || ".jpg";
    const fileName = slugify(title) + ext;
    const filePath = path.join(STATIC_DIR, fileName);
    const publicPath = "/news/" + fileName;

    if (fs.existsSync(filePath)) return publicPath;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download image");
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
    console.log("✅ Saved image:", publicPath);
    return publicPath;
  } catch (err) {
    console.warn("⚠️ Could not download image for", title, err.message);
    return null;
  }
}

// --- TOML-ish front matter parser (simple) ---
function parseFrontmatter(content) {
  const parts = content.split("+++");
  if (parts.length < 3) return { toml: {}, body: content };
  const frontmatter = parts[1].trim();
  const body = parts.slice(2).join("+++").trim();

  const lines = frontmatter.split("\n");
  const data = {};
  let currentKey, currentArray;

  for (const line of lines) {
    if (line.startsWith("[[extra.external]]")) {
      currentArray = data.extra = data.extra || {};
      currentArray.external = currentArray.external || [];
      currentArray.external.push({});
      currentKey = currentArray.external[currentArray.external.length - 1];
    } else if (line.startsWith("[extra]")) {
      data.extra = data.extra || {};
    } else if (/^[a-zA-Z]/.test(line)) {
      const [k, v] = line.split("=").map(s => s.trim());
      const val = v?.replace(/^"|"$/g, "");
      if (currentKey) currentKey[k] = val;
      else data[k] = val;
    }
  }

  return { toml: data, body };
}

function toTOML(data) {
  let out = "";
  for (const [k, v] of Object.entries(data)) {
    if (k === "extra") {
      out += "\n[extra]\n";
      if (v.external) {
        for (const item of v.external) {
          out += "\n[[extra.external]]\n";
          for (const [ik, iv] of Object.entries(item)) {
            out += `${ik} = "${iv}"\n`;
          }
        }
      }
    } else {
      out += `${k} = "${v}"\n`;
    }
  }
  return out.trim() + "\n";
}

// --- Main logic ---
async function main() {
  fs.mkdirSync(STATIC_DIR, { recursive: true });

  const content = fs.readFileSync(NEWS_FILE, "utf8");
  const { toml, body } = parseFrontmatter(content);

  let updated = false;

  for (const item of toml.extra?.external || []) {
    if (!item.image && item.url) {
      const og = await fetchOGImage(item.url);
      if (og) {
        const local = await downloadImage(og, item.title);
        if (local) {
          item.image = local;
          updated = true;
        }
      }
    }
  }

  if (updated) {
    const newFrontmatter = toTOML(toml);
    fs.writeFileSync(NEWS_FILE, `+++\n${newFrontmatter}+++\n\n${body}\n`);
    console.log("✅ Updated news file with local images.");
  } else {
    console.log("ℹ️ No updates needed.");
  }
}

main();
