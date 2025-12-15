from pathlib import Path

FILES = [
    ("index.html", "text/html"),
    ("styles.css", "text/css"),
    ("app.js", "application/javascript"),
]


def choose_delimiter(content: str) -> str:
    for cand in ["~", "!", "^", "`", "%", "$", "*", "?", "|", "+", "-", "=", ";", "@"]:
        if cand not in content:
            return cand
    raise ValueError("No safe delimiter found for q-quoting")


def build_insert(filename: str, mime: str, content: str) -> str:
    delim = choose_delimiter(content)
    return (
        f"insert into dart_app_files (filename, mime_type, content)\n"
        f"values ('{filename}', '{mime}', q'{delim}{content}{delim}');\n"
    )


def main():
    parts = [
        "set define off;\n",
        "\n",
        "create table dart_app_files (\n"
        "  filename varchar2(255) primary key,\n"
        "  mime_type varchar2(64) not null,\n"
        "  content clob not null\n"
        ");\n\n",
        "-- remove existing rows for idempotent loading\n",
    ]

    names = ", ".join(f"'{name}'" for name, _ in FILES)
    parts.append(f"delete from dart_app_files where filename in ({names});\n\n")

    for name, mime in FILES:
        content = Path(name).read_text(encoding="utf-8")
        parts.append(build_insert(name, mime, content))
        parts.append("\n")

    parts.append("commit;\n\n")
    parts.append(
        "-- Usage:\n"
        "--  sqlplus user/password@connect @oracle_seed.sql\n"
        "--  -- Reconstruct files locally:\n"
        "--  set pagesize 0 linesize 32767 long 1000000 longchunksize 1000000\n"
        "--  spool index.html; select content from dart_app_files where filename='index.html'; spool off;\n"
    )

    Path("oracle_seed.sql").write_text("".join(parts), encoding="utf-8")


if __name__ == "__main__":
    main()
