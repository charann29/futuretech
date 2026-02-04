def latextxt(text):
    if not text:
        return ""
    # Escape special TeX characters
    chars = {
        "&": "\\&",
        "%": "\\%",
        "$": "\\$",
        "#": "\\#",
        "_": "\\_",
        "{": "\\{",
        "}": "\\}",
        "~": "\\textasciitilde{}",
        "^": "\\textasciicircum{}",
        "\\": "\\textbackslash{}"
    }
    return "".join(chars.get(c, c) for c in str(text))
