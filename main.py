#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gera um único arquivo Markdown com o conteúdo dos arquivos de uma pasta.
Suporta exportação dividida em N partes com --split N.
"""

import sys
import mimetypes
import logging
import subprocess
import argparse
import re
from pathlib import Path
from datetime import datetime

# Logger configurado para mostrar DEBUG se necessário, mas INFO por padrão
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIG
# =============================================================================

class Config:
    CHECK_TYPESCRIPT_ERRORS = True
    INCLUDE_SELF_IN_OUTPUT = False

    STRIP_COMMENTS_AND_BLANK_LINES = True
    COLLAPSIBLE_EXTENSIONS = {".json", ".css", ".html", ".svg", ".md", ".xml", ".yml", ".yaml"}
    COLLAPSIBLE_PATHS = {"components/ui"}

    LANG_BY_EXT = {
        ".md": "md", ".markdown": "md", ".txt": "", ".rst": "rst",
        ".html": "html", ".htm": "html", ".xml": "xml", ".json": "json",
        ".yml": "yaml", ".yaml": "yaml", ".csv": "csv", ".tsv": "tsv",
        ".py": "python", ".ipynb": "json", ".js": "javascript", ".ts": "ts",
        ".tsx": "tsx", ".jsx": "jsx", ".java": "java", ".c": "c",
        ".h": "c", ".cpp": "cpp", ".hpp": "cpp", ".cs": "csharp",
        ".go": "go", ".rb": "ruby", ".php": "php", ".sh": "bash",
        ".bash": "bash", ".zsh": "bash", ".ps1": "powershell", ".lua": "lua",
        ".rs": "rust", ".kt": "kotlin", ".swift": "swift", ".sql": "sql",
        ".R": "r", ".dockerfile": "dockerfile"
    }

    MIME_PREFIXES_TO_IGNORE = {"image/", "audio/", "font/"}
    FONT_MIME_SET = {
        "application/font-ttf", "application/x-font-ttf",
        "application/x-font-truetype", "application/font-sfnt",
        "application/x-font-sfnt", "application/vnd.ms-fontobject",
        "application/font-woff", "application/x-font-woff",
        "application/font-woff2", "application/x-font-opentype",
    }

    FONT_EXT_SET = {".ttf", ".otf", ".woff", ".woff2", ".eot", ".sfnt", ".pfa", ".pfb"}

    IGNORED_DIRS = {
        ".git", ".vscode", "__pycache__", "node_modules", "dist",
        "build", ".venv", ".cache", ".idea", ".next", "generated", "migrations", ".vercel", "android", "messages", "export"
    }

    IGNORED_EXACT_FILENAMES = {"tsconfig.tsbuildinfo", "pnpm-lock.yaml"}
    IGNORED_FILENAMES = {"jquery", "font-awesome", "fontawesome", "pnpm-lock", "package-lock", "yarn", ".env"}
    IGNORED_SUFFIXES = {".min.css", ".min.js"}

    MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


# =============================================================================
# COMPILADOR
# =============================================================================

class FileCompiler:
    def __init__(self, root_path: Path, output_path: Path, include_self: bool = False):
        self.root = root_path
        self.out_path = output_path
        self.config = Config()
        self.config.INCLUDE_SELF_IN_OUTPUT = include_self
        self.generation_time = datetime.now()

    # ------------------------- TIMESTAMP -------------------------

    def _format_timestamp(self) -> str:
        return self.generation_time.strftime("%d/%m/%Y às %H:%M:%S")

    def _format_iso_timestamp(self) -> str:
        return self.generation_time.isoformat()

    # ------------------------- IGNORE LOGIC -------------------------

    def is_ignored(self, file_path: Path) -> bool:
        lower_name = file_path.name.lower()
        if lower_name in self.config.IGNORED_EXACT_FILENAMES:
            return True
        if any(lower_name.endswith(s) for s in self.config.IGNORED_SUFFIXES):
            return True
        if any(f in file_path.stem.lower() for f in self.config.IGNORED_FILENAMES):
            return True
        if self._is_font(file_path):
            return True
        if self._is_large_file(file_path):
            return True
        return False

    def _is_font(self, path: Path) -> bool:
        mtype, _ = mimetypes.guess_type(str(path))
        if mtype in self.config.FONT_MIME_SET:
            return True
        return path.suffix.lower() in self.config.FONT_EXT_SET

    def _is_large_file(self, path: Path) -> bool:
        try:
            return path.stat().st_size > self.config.MAX_FILE_SIZE_BYTES
        except FileNotFoundError:
            return False

    # ------------------------- LIST FILES -------------------------

    def _get_files_to_process(self):
        entries = []
        script_path = Path(__file__).resolve()

        for p in self.root.rglob("*"):
            if p.is_file():
                if p.resolve() == self.out_path.resolve():
                    continue
                if p.resolve() == script_path and not self.config.INCLUDE_SELF_IN_OUTPUT:
                    continue
                if any(part in self.config.IGNORED_DIRS for part in p.parts):
                    continue
                entries.append(p)

        entries.sort(key=lambda p: str(p.relative_to(self.root)).lower())
        return entries

    # ------------------------- NOISE CLEANING -------------------------

    def _strip_noise(self, content: str, lang: str) -> str:
        if not self.config.STRIP_COMMENTS_AND_BLANK_LINES:
            return content

        if lang in ["python", "javascript", "ts", "tsx", "jsx", "java", "c", "cpp", "csharp", "go", "rust", "swift", "kt", "kotlin", "sql"]:
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            content = re.sub(r'//.*', '', content)
            content = re.sub(r'#.*', '', content)
            content = re.sub(r'--.*', '', content)
        elif lang in ["html", "xml"]:
            content = re.sub(r'', '', content, flags=re.DOTALL)

        lines = [l for l in content.split("\n") if l.strip()]
        return "\n".join(lines)

    def _read_text_safely(self, path: Path):
        for enc in ["utf-8", "latin-1"]:
            try:
                content = path.read_text(encoding=enc, errors="replace")
                content = content.replace("\u2028", "\n").replace("\u2029", "\n")
                lang = self.config.LANG_BY_EXT.get(path.suffix.lower(), "")
                return self._strip_noise(content, lang)
            except Exception:
                pass
        return None

    # ------------------------- HEADER -------------------------

    def _header(self, part: int | None = None, total: int | None = None):
        h = [
            f"# Compilação de arquivos de `{self.root}`\n",
            f"**Gerado em:** {self._format_timestamp()}  \n",
            f"**ISO:** `{self._format_iso_timestamp()}`\n",
        ]
        if part is not None:
            h.append(f"\n### PARTE {part}/{total}\n")
        h.append("> Export automático.\n")
        return h

    # ------------------------- TREE -------------------------

    def _generate_file_tree(self, files):
        tree = ["# Estrutura do Projeto\n", "```"]
        struct = {}
        for path in files:
            parts = path.relative_to(self.root).parts
            d = struct
            for p in parts:
                d = d.setdefault(p, {})

        def build(d, prefix=""):
            keys = sorted(d.keys())
            for i, k in enumerate(keys):
                branch = "├── " if i < len(keys) - 1 else "└── "
                tree.append(prefix + branch + k)
                build(d[k], prefix + ("│   " if i < len(keys) - 1 else "    "))

        build(struct)
        tree.append("```\n")
        return tree

    # ------------------------- FILE CONTENT -------------------------

    def _generate_markdown(self, p: Path):
        rel = p.relative_to(self.root)
        lines = [f"\n## {rel}"]
        mime = mimetypes.guess_type(str(p))[0]
        if mime and any(mime.startswith(prefix) for prefix in self.config.MIME_PREFIXES_TO_IGNORE):
            lines.append(f"- **Arquivo de mídia**: `{p.name}`")
            return lines

        if self.is_ignored(p):
            size = round(p.stat().st_size / 1024, 2)
            lines.append(f"- **Arquivo ignorado** ({size} KB)")
            return lines

        text = self._read_text_safely(p)
        lang = self.config.LANG_BY_EXT.get(p.suffix.lower(), "")

        if text is None:
            lines.append("- **Não textual ou ilegível**")
            return lines

        collapsible = (
            p.suffix.lower() in self.config.COLLAPSIBLE_EXTENSIONS or
            any(folder in str(rel) for folder in self.config.COLLAPSIBLE_PATHS)
        )

        if collapsible:
            lines.append(f"<details><summary>{p.name}</summary>\n")
            lines.append(f"```{lang}")
            lines.append(text)
            lines.append("```")
            lines.append("</details>")
        else:
            lines.append(f"```{lang}")
            lines.append(text)
            lines.append("```")

        return lines

    # ------------------------- NODE EXECUTION HELPER -------------------------

    def _run_node_command(self, command_args: list) -> subprocess.CompletedProcess:
        """Executa comandos Node/Shell com logs detalhados."""
        cmd_str = " ".join(command_args)
        logger.info(f"🚀 Executando comando: {cmd_str}")
        
        start_time = datetime.now()
        try:
            # shell=True no Windows pode ajudar a achar 'npx' se o path estiver instável,
            # mas vamos tentar direto primeiro. Se der erro, o catch captura.
            run = subprocess.run(
                command_args,
                cwd=self.root,
                capture_output=True,
                text=True,
                shell=True # Descomente se tiver problemas de path no Windows
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            if run.returncode == 0:
                logger.info(f"✅ Comando '{cmd_str}' sucesso! ({duration:.2f}s)")
            else:
                logger.warning(f"⚠️ Comando '{cmd_str}' retornou código {run.returncode} ({duration:.2f}s)")
                # Mostra o erro no console para debug imediato
                if run.stdout.strip():
                    logger.info(f"--- STDOUT ---\n{run.stdout.strip()}")
                if run.stderr.strip():
                    logger.error(f"--- STDERR ---\n{run.stderr.strip()}")
            
            return run

        except FileNotFoundError:
            logger.error(f"❌ Executável não encontrado para o comando: {cmd_str}. Verifique o PATH.")
            # Retorna um objeto fake para não quebrar o fluxo
            return subprocess.CompletedProcess(args=command_args, returncode=127, stdout="", stderr="Comando não encontrado")
        except Exception as e:
            logger.error(f"❌ Erro inesperado ao rodar '{cmd_str}': {e}")
            return subprocess.CompletedProcess(args=command_args, returncode=1, stdout="", stderr=str(e))

    # ------------------------- TYPESCRIPT CHECK -------------------------

    def _check_typescript_errors(self):
        result = ["\n# Verificação de TypeScript\n"]
        pkg = self.root / "package.json"

        if not pkg.exists():
            return result

        # Usando o novo helper de execução
        run = self._run_node_command(["npx", "tsc", "--noEmit"])

        if run.returncode == 0:
            result.append("Nenhum erro encontrado.\n")
        else:
            result.append("```")
            result.append(run.stdout)
            result.append(run.stderr)
            result.append("```")
        
        return result

    # ------------------------- SINGLE EXPORT -------------------------

    def _compile_single(self, files):
        md = []
        md.extend(self._header())
        md.extend(self._generate_file_tree(files))
        for f in files:
            md.extend(self._generate_markdown(f))

        if self.config.CHECK_TYPESCRIPT_ERRORS:
            md.extend(self._check_typescript_errors())

        self.out_path.write_text("\n\n".join(md), encoding="utf-8")
        logger.info(f"📁 Arquivo único gerado: {self.out_path}")

    # ------------------------- SPLIT EXPORT (IN N PARTS) -------------------------

    def _compile_split(self, files, split):
        total_files = len(files)
        part_size = (total_files + split - 1) // split
        chunks = [files[i:i + part_size] for i in range(0, total_files, part_size)]
        total_parts = len(chunks)

        export_dir = self.out_path.parent / "export"
        export_dir.mkdir(parents=True, exist_ok=True)

        for idx, chunk in enumerate(chunks, start=1):
            outfile = export_dir / f"export_{idx}.md"
            md = []
            md.extend(self._header(part=idx, total=total_parts))
            md.extend(self._generate_file_tree(chunk))
            
            for f in chunk:
                md.extend(self._generate_markdown(f))

            if self.config.CHECK_TYPESCRIPT_ERRORS and idx == 1:
                md.extend(self._check_typescript_errors())

            outfile.write_text("\n\n".join(md), encoding="utf-8")
            logger.info(f"📄 Parte {idx}/{total_parts} gerada: {outfile}")

        logger.info("✅ Export dividido concluído.")

    # ------------------------- ENTRY -------------------------

    def compile(self, split=0):
        files = self._get_files_to_process()
        if split <= 1:
            self._compile_single(files)
        else:
            self._compile_split(files, split)


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Compila arquivos da pasta para Markdown.")
    parser.add_argument("pasta", nargs="?", default=".", help="Pasta alvo (default: atual).")
    parser.add_argument("saida", nargs="?", default="export.md", help="Arquivo de saída.")
    parser.add_argument("--incluir-script", action="store_true", help="Inclui o próprio script no markdown.")
    parser.add_argument("--split", type=int, default=0, help="Divide o export em N partes iguais.")

    args = parser.parse_args()
    root = Path(args.pasta).expanduser()
    out = Path(args.saida).expanduser()

    if not root.exists() or not root.is_dir():
        logger.error("❌ Pasta inválida.")
        sys.exit(1)

    compiler = FileCompiler(root, out, include_self=args.incluir_script)
    compiler.compile(split=args.split)


if __name__ == "__main__":
    main()