import os
import re
import curses
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# =====================
# --- CONFIG ---
# =====================
BASE_PATH = Path.cwd()
OUTPUT_BASENAME = "project_snapshot"
OUTPUT_EXT = ".txt"

DEFAULT_ENTRIES = [
    "package.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.cjs",
    "styles.css",
    "manifest.json",
    "eslint.config.mts",
    "esbuild.config.mjs",
    "src",
]

IGNORED_DIRS = {".git", "node_modules", ".obsidian", "__pycache__"}
TEST_DIRS = {"__tests__", "tests", "test"}

MAX_FILE_SIZE = 500_000
SUPPORTED_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py"}

# =====================
# --- TEST PATTERNS ---
# =====================
TEST_FILE_PATTERNS = [
    re.compile(r"\.test\.(ts|tsx|js|jsx|py)$"),
    re.compile(r"\.spec\.(ts|tsx|js|jsx|py)$"),
]

# =====================
# --- RUNTIME OPTIONS ---
# =====================
RUNTIME_OPTIONS = {
    "expand_import_tree": False,
    "include_dependency_graph": True,
    "include_related_tests": True,
}

# =====================
# --- STATE ---
# =====================
DEPENDENCY_GRAPH = defaultdict(set)
VISITED_FILES = set()

# =====================
# --- IMPORT PATTERNS ---
# =====================
IMPORT_PATTERNS = {
    "js_ts": [
        re.compile(r"import\s+.*?\s+from\s+['\"](.+?)['\"]"),
        re.compile(r"export\s+.*?\s+from\s+['\"](.+?)['\"]"),
        re.compile(r"require\(['\"](.+?)['\"]\)"),
        re.compile(r"import\(['\"](.+?)['\"]\)"),
    ],
    "python": [
        re.compile(r"from\s+([a-zA-Z0-9_./]+)\s+import"),
        re.compile(r"import\s+([a-zA-Z0-9_./]+)"),
    ],
}

# =====================
# --- UTILITIES ---
# =====================
def reset_state():
    DEPENDENCY_GRAPH.clear()
    VISITED_FILES.clear()


def get_unique_output_file():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    return BASE_PATH / f"{OUTPUT_BASENAME}_{ts}{OUTPUT_EXT}"


def safe_read_file(path: Path) -> str:
    try:
        if path.stat().st_size > MAX_FILE_SIZE:
            return "[SKIPPED] Archivo demasiado grande\n"
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"[ERROR] {e}\n"


def is_test_file(path: Path) -> bool:
    if path.parent.name in TEST_DIRS:
        return True
    return any(p.search(path.name) for p in TEST_FILE_PATTERNS)


# =====================
# --- IMPORT ANALYSIS ---
# =====================
def analyze_imports(path: Path, content: str):
    if path.suffix not in SUPPORTED_EXTENSIONS:
        return []

    patterns = (
        IMPORT_PATTERNS["js_ts"]
        if path.suffix in {".ts", ".tsx", ".js", ".jsx"}
        else IMPORT_PATTERNS["python"]
    )

    imports = set()
    for pattern in patterns:
        for match in pattern.findall(content):
            imports.add(match)

    return sorted(imports)


def resolve_import_path(base_file: Path, imp: str):
    if not imp.startswith("."):
        return None

    base_dir = base_file.parent
    candidate = (base_dir / imp).resolve()

    for ext in SUPPORTED_EXTENSIONS:
        if candidate.with_suffix(ext).exists():
            return candidate.with_suffix(ext)

    if candidate.is_dir():
        for ext in SUPPORTED_EXTENSIONS:
            index = candidate / f"index{ext}"
            if index.exists():
                return index

    return None


# =====================
# --- TEST DISCOVERY ---
# =====================
def find_related_tests(component_path: Path):
    tests = []
    base_name = component_path.stem

    for root, dirs, files in os.walk(BASE_PATH):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for f in files:
            p = Path(root) / f
            if is_test_file(p) and base_name in p.name:
                tests.append(p)

    return sorted(set(tests))


# =====================
# --- SNAPSHOT LOGIC ---
# =====================
def write_file(path: Path, out):
    if path in VISITED_FILES:
        return

    VISITED_FILES.add(path)

    content = safe_read_file(path)
    imports = analyze_imports(path, content)

    icon = "🧪" if is_test_file(path) else "📄"
    out.write(f"\n{icon} FILE: {path}\n")
    out.write("-" * 60 + "\n")

    if imports:
        out.write("🔗 IMPORTS:\n")
        for imp in imports:
            DEPENDENCY_GRAPH[str(path)].add(imp)
            out.write(f"  → {imp}\n")
        out.write("-" * 60 + "\n")

    out.write(content)
    out.write("\n" + "-" * 60 + "\n")

    if RUNTIME_OPTIONS["include_related_tests"] and not is_test_file(path):
        for test in find_related_tests(path):
            write_file(test, out)

    if RUNTIME_OPTIONS["expand_import_tree"]:
        for imp in imports:
            resolved = resolve_import_path(path, imp)
            if resolved:
                write_file(resolved, out)


def write_folder(folder: Path, out):
    out.write(f"\n📁 FOLDER: {folder}\n")
    out.write("=" * 60 + "\n")

    for root, dirs, files in os.walk(folder):
        root_path = Path(root)
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        level = len(root_path.relative_to(folder).parts)
        indent = "  " * level

        icon = "🧪" if root_path.name in TEST_DIRS else "📁"
        out.write(f"\n{indent}{icon} {root_path.name}/\n")

        for file in sorted(files):
            write_file(root_path / file, out)


def write_entry(path: Path, out):
    if path.is_file():
        write_file(path, out)
    elif path.is_dir():
        write_folder(path, out)


def write_dependency_report(out):
    if not RUNTIME_OPTIONS["include_dependency_graph"]:
        return

    if not DEPENDENCY_GRAPH:
        return

    out.write("\n\n🔗 GLOBAL DEPENDENCY GRAPH\n")
    out.write("=" * 60 + "\n")

    for file, imports in DEPENDENCY_GRAPH.items():
        out.write(f"\n📄 {file}\n")
        for imp in sorted(imports):
            out.write(f"  imports → {imp}\n")


# =====================
# --- FILE SELECTOR (CURSES) ---
# =====================
def list_dir(path: Path):
    items = []
    try:
        for p in sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
            if p.name in IGNORED_DIRS:
                continue
            items.append(p)
    except PermissionError:
        pass
    return items


def draw_centered(stdscr, y, text, attr=0):
    h, w = stdscr.getmaxyx()
    x = max(0, (w - len(text)) // 2)
    try:
        stdscr.addstr(y, x, text[: w - 1], attr)
    except curses.error:
        pass


def file_selector(stdscr, start_path=BASE_PATH):
    current = start_path
    cursor = 0
    selected = set()

    while True:
        stdscr.clear()
        draw_centered(stdscr, 1, "📂 Seleccionar archivos / carpetas")
        draw_centered(stdscr, 2, str(current))
        draw_centered(
            stdscr,
            3,
            "↑↓ mover | ENTER abrir | SPACE seleccionar | BACK volver | F finalizar",
        )

        items = list_dir(current)
        h, w = stdscr.getmaxyx()
        visible = items[max(0, cursor - h + 8) : cursor + h - 8]

        for i, p in enumerate(visible):
            idx = items.index(p)
            marker = "[✓]" if p in selected else "[ ]"
            icon = "📁" if p.is_dir() else "📄"
            line = f"{marker} {icon} {p.name}"
            attr = curses.A_REVERSE if idx == cursor else 0
            try:
                stdscr.addstr(i + 5, 2, line[: w - 4], attr)
            except curses.error:
                pass

        key = stdscr.getch()

        if key == curses.KEY_UP:
            cursor = max(0, cursor - 1)
        elif key == curses.KEY_DOWN:
            cursor = min(len(items) - 1, cursor + 1)
        elif key in (10, 13):
            if items and items[cursor].is_dir():
                current = items[cursor]
                cursor = 0
        elif key == ord(" "):
            p = items[cursor]
            selected.remove(p) if p in selected else selected.add(p)
        elif key in (curses.KEY_BACKSPACE, 127):
            if current != start_path:
                current = current.parent
                cursor = 0
        elif key in (ord("f"), ord("F")):
            return list(selected)


# =====================
# --- MENUS ---
# =====================
def main_menu(stdscr):
    options = [
        "Usar configuración predeterminada",
        "Seleccionar archivos / carpetas manualmente",
        "Salir",
    ]
    cursor = 0

    while True:
        stdscr.clear()
        draw_centered(stdscr, 1, "📦 PROJECT SNAPSHOT", curses.A_BOLD)
        draw_centered(stdscr, 2, "=" * 40)

        for i, opt in enumerate(options):
            draw_centered(
                stdscr, i + 4, opt, curses.A_REVERSE if i == cursor else 0
            )

        key = stdscr.getch()
        if key == curses.KEY_UP:
            cursor = max(0, cursor - 1)
        elif key == curses.KEY_DOWN:
            cursor = min(len(options) - 1, cursor + 1)
        elif key in (10, 13):
            return cursor


def options_menu(stdscr):
    keys = list(RUNTIME_OPTIONS.keys())
    cursor = 0

    while True:
        stdscr.clear()
        draw_centered(stdscr, 1, "⚙ SNAPSHOT OPTIONS", curses.A_BOLD)
        draw_centered(stdscr, 2, "=" * 40)

        for i, key in enumerate(keys):
            checked = "[✓]" if RUNTIME_OPTIONS[key] else "[ ]"
            label = key.replace("_", " ").title()
            draw_centered(
                stdscr,
                i + 4,
                f"{checked} {label}",
                curses.A_REVERSE if i == cursor else 0,
            )

        draw_centered(stdscr, len(keys) + 6, "SPACE toggle | ENTER continuar")

        k = stdscr.getch()
        if k == curses.KEY_UP:
            cursor = max(0, cursor - 1)
        elif k == curses.KEY_DOWN:
            cursor = min(len(keys) - 1, cursor + 1)
        elif k == ord(" "):
            RUNTIME_OPTIONS[keys[cursor]] = not RUNTIME_OPTIONS[keys[cursor]]
        elif k in (10, 13):
            break


# =====================
# --- MAIN ---
# =====================
def run(stdscr):
    reset_state()

    choice = main_menu(stdscr)
    if choice == 2:
        return None

    options_menu(stdscr)

    if choice == 0:
        entries = [BASE_PATH / e for e in DEFAULT_ENTRIES if (BASE_PATH / e).exists()]
    else:
        entries = file_selector(stdscr)

    if not entries:
        return None

    output_file = get_unique_output_file()

    with output_file.open("w", encoding="utf-8") as out:
        out.write("📦 PROJECT SNAPSHOT\n")
        out.write(f"Base path: {BASE_PATH}\n")
        out.write(f"Generated: {datetime.now()}\n")
        out.write("=" * 60 + "\n")

        for path in sorted(entries):
            write_entry(path, out)

        write_dependency_report(out)

    return output_file


if __name__ == "__main__":
    output = curses.wrapper(run)
    if output:
        print(f"\n✅ Snapshot generado: {output}")
