#!/usr/bin/env python3
"""Radar Fiscal Brasil: curadoria automatizada a partir de fontes oficiais.

Somente publica manchetes, datas, excertos e links efetivamente obtidos em
feeds públicos de fontes selecionadas. Não usa LLM para atribuir regras.
Impactos são orientações genéricas por tema, nunca uma afirmação normativa.
"""
from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "noticias_fiscais.json"
FEEDS = (
    ("Receita Federal - Reforma Tributária", "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/ultimas-noticias/noticias/RSS"),
    ("Receita Federal - Notícias", "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/RSS"),
    ("NFS-e Nacional", "https://www.gov.br/nfse/pt-br/noticias/RSS"),
    ("Ministério da Fazenda", "https://www.gov.br/fazenda/pt-br/assuntos/noticias/RSS"),
    ("Receita Federal - 2026", "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/RSS"),
    ("Agência Brasil - Economia", "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml"),
    ("Ministério do Desenvolvimento, Indústria e Comércio", "https://www.gov.br/mdic/pt-br/assuntos/noticias/RSS"),
    ("Ministério dos Transportes", "https://www.gov.br/transportes/pt-br/assuntos/noticias/RSS"),
    ("Anfavea - Imprensa", "https://anfavea.com.br/site/imprensa-noticia/feed/"),
)
TRUSTED = {"www.gov.br", "gov.br", "www.nfe.fazenda.gov.br", "nfe.fazenda.gov.br",
           "agenciabrasil.ebc.com.br", "dfe-portal.svrs.rs.gov.br",
           "anfavea.com.br", "www.anfavea.com.br"}
SITE_PAGES = (
    ("Portal DC-e - Avisos", "https://dfe-portal.svrs.rs.gov.br/Dce/Avisos", "dce"),
    ("Portal DC-e - Notícias", "https://dfe-portal.svrs.rs.gov.br/Dce/Noticias", "dce"),
    ("Anfavea - Notícias", "https://anfavea.com.br/site/imprensa-noticia/", "automotive"),
)
RELEVANT = re.compile(
    r"\b(nf-?e|nfc-?e|nfs-?e|ct-?e|mdf-?e|dc-?e|dce|dace|"
    r"declara[cç][aã]o de conte[uú]do eletr[oô]nica|"
    r"sped|pgdas|simples nacional|ibs|cbs|icms|issqn|"
    r"reforma tribut[aá]ria|nota fiscal|documentos? fiscais?|"
    r"tribut[aá]ri[oa]|obriga[cç][aã]o acess[oó]ria|"
    r"emiss[aã]o de notas?|nota t[eé]cnica|declar[aã]c[aã]o de regimes|"
    r"al[ií]quota|nfcom|c-?npj alfanum[eé]rico|"
    r"montadoras?|ind[uú]stria (?:automotiva|automobil[ií]stica)|anfavea|"
    r"produ[cç][aã]o de ve[ií]culos|emplacamentos?|f[aá]bricas? de ve[ií]culos|"
    r"ford|toyota|honda|polaris|volkswagen|gm|chevrolet|"
    r"ve[ií]culos eletrificados|fabrica[cç][aã]o de autom[oó]veis)\b",
    re.I,
)
EXCLUDE = re.compile(
    r"\b(apreens[aã]o|contrabando|pris[aã]o|leil[aã]o|"
    r"concurso p[uú]blico|oper[aã]c[aã]o fronteira)\b", re.I
)
CATEGORIES = (
    ("DCEs", re.compile(r"\b(dc-?e|dce|dace|declara[cç][aã]o de conte[uú]do eletr[oô]nica)\b", re.I),
     "Ponto de atenção: confira se a DC-e é permitida para a operação, as validações do emissor e a exigência de DACE. A DC-e não substitui NF-e quando esta for obrigatória."),
    ("Montadoras", re.compile(r"\b(montadoras?|anfavea|ind[uú]stria (?:automotiva|automobil[ií]stica)|"
     r"produ[cç][aã]o de ve[ií]culos|emplacamentos?|f[aá]bricas? de ve[ií]culos|"
     r"ford|toyota|honda|polaris|volkswagen|gm|chevrolet|ve[ií]culos eletrificados)\b", re.I),
     "Ponto de atenção: acompanhe repercussões em produção, coletas, distribuição e faturamento de veículos. Dados de mercado não representam, por si só, mudança na legislação fiscal."),
    ("Transporte", re.compile(r"\b(ct-?e|mdf-?e|dc-?e|dace|transporte de carga)\b", re.I),
     "Ponto de atenção: transportadoras devem conferir eventuais ajustes de leiaute, emissão ou validação do documento citado."),
    ("Emissão", re.compile(r"\b(nf-?e|nfc-?e|nfs-?e|nota fiscal|emiss[aã]o|documentos? fiscais?)\b", re.I),
     "Ponto de atenção: equipes fiscais e desenvolvedores devem verificar se a orientação altera regras, prazos ou campos do emissor utilizado."),
    ("Impostos", re.compile(r"\b(ibs|cbs|icms|issqn|pgdas|simples nacional|imposto|tribut[aá]ri)\b", re.I),
     "Ponto de atenção: confira com a área fiscal as condições, o período de vigência e o tratamento tributário aplicável à empresa."),
)

def canonical(url: str) -> str:
    value = urllib.parse.urlsplit((url or "").strip())
    if value.scheme != "https" or value.hostname not in TRUSTED:
        return ""
    path = value.path.rstrip("/") or "/"
    return urllib.parse.urlunsplit(("https", value.hostname, path, "", ""))

def fetch(url: str, *, max_bytes=1_500_000) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": "Conferencia360-FiscalRadar/1.0 (news aggregation; public source)",
                      "Accept": "application/atom+xml, application/rss+xml, application/xml, text/html;q=0.8"}
    )
    with urllib.request.urlopen(req, timeout=22) as response:
        data = response.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ValueError("Resposta excede o limite de tamanho")
        return data

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("style", "script"):
            self.skip += 1
    def handle_endtag(self, tag):
        if tag in ("style", "script") and self.skip:
            self.skip -= 1
    def handle_data(self, text):
        if not self.skip:
            self.parts.append(text)

def plaintext(text: str) -> str:
    parser = TextExtractor()
    parser.feed(html.unescape(text or ""))
    return re.sub(r"\s+", " ", " ".join(parser.parts)).strip()

def short(text: str, maxlen=238) -> str:
    text = plaintext(text)
    if len(text) <= maxlen:
        return text
    excerpt = text[:maxlen]
    stop = excerpt.rfind(" ")
    return (excerpt[:stop] if stop > maxlen * .6 else excerpt).strip(" .,;:") + "…"

def parse_date(value):
    if not value:
        return None
    try:
        d = dt.datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        try:
            d = email.utils.parsedate_to_datetime(value)
        except (TypeError, ValueError):
            return None
    return d.date()

def get_text(node, *names):
    for name in names:
        el = node.find(name)
        if el is not None and (el.text or "").strip():
            return (el.text or "").strip()
    return ""

def parse_feed(data):
    root = ET.fromstring(data)
    result = []
    if root.tag.endswith("feed"):  # Atom (gov.br / Plone)
        ns = "{http://www.w3.org/2005/Atom}"
        for entry in root.findall(ns + "entry"):
            title = get_text(entry, ns + "title")
            summary = get_text(entry, ns + "summary", ns + "content")
            updated = get_text(entry, ns + "published", ns + "updated")
            links = entry.findall(ns + "link")
            link = next((e.get("href", "") for e in links if e.get("rel", "alternate") == "alternate"), "")
            if not link and links: link = links[0].get("href", "")
            result.append((title, link, summary, updated))
    else:  # RSS 2.0
        for item in root.findall(".//item"):
            result.append((
                get_text(item, "title"), get_text(item, "link"),
                get_text(item, "description", "{http://purl.org/rss/1.0/modules/content/}encoded"),
                get_text(item, "pubDate", "{http://purl.org/dc/elements/1.1/}date"),
            ))
    return result

class SocialImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.image = ""
        self.description = ""
    def handle_starttag(self, tag, attrs):
        if tag != "meta": return
        props = dict(attrs)
        key = (props.get("property") or props.get("name") or "").lower()
        value = props.get("content", "")
        if key in ("og:image", "twitter:image") and not self.image:
            self.image = value
        if key in ("description", "og:description") and not self.description:
            self.description = value

def related_image(url: str):
    """Extrai só metadados de imagem do artigo oficial, sem copiar a imagem."""
    try:
        parser = SocialImageParser()
        parser.feed(fetch(url, max_bytes=850_000).decode("utf-8", "replace"))
        image = urllib.parse.urljoin(url, parser.image)
        parts = urllib.parse.urlsplit(image)
        if parts.scheme == "https" and parts.hostname in TRUSTED:
            return image[:700], parser.description
    except Exception:
        return "", ""
    return "", ""

def categorise(title, excerpt):
    body = title + " " + excerpt
    for name, regex, impact in CATEGORIES:
        if regex.search(body):
            return name, impact
    return "Impostos", CATEGORIES[-1][2]

def is_relevant(title, excerpt):
    text = title + " " + excerpt
    return bool(RELEVANT.search(text)) and not EXCLUDE.search(title)


class PageCollector(HTMLParser):
    """Captura títulos, links e texto de páginas editoriais abertas, sem inferir conteúdo ausente."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.headings = []
        self._tag = None
        self._link = ""
        self._parts = []
        self._skip = 0
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag in ("script", "style", "noscript"):
            self._skip += 1
        if not self._skip and tag in ("h1", "h2", "h3", "a"):
            self._tag = tag
            self._parts = []
            self._link = props.get("href", "") if tag == "a" else ""
    def handle_data(self, value):
        if not self._skip and self._tag:
            self._parts.append(value)
    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1
        if self._tag == tag:
            value = re.sub(r"\s+", " ", " ".join(self._parts)).strip()
            if tag == "a" and self._link and value:
                self.links.append((self._link, value))
            if tag in ("h1", "h2", "h3") and value:
                self.headings.append((tag, value))
            self._tag = None
            self._parts = []

def valid_article_date(value):
    try:
        return dt.datetime.strptime(value, "%d/%m/%Y").date()
    except ValueError:
        return None

def parse_dce_bulletins(body: bytes, page_url: str):
    """O portal SVRS divulga avisos HTML com data explícita (não um feed RSS)."""
    raw = plaintext(body.decode("utf-8", "replace"))
    marks = list(re.finditer(r"(?<!\d)(\d{2}/\d{2}/20\d{2})(?!\d)", raw))
    found = []
    for index, match in enumerate(marks):
        date = valid_article_date(match.group(1))
        if not date:
            continue
        text = raw[match.end():marks[index + 1].start() if index + 1 < len(marks) else len(raw)]
        text = re.sub(r"\s+", " ", text).strip()
        if not re.search(r"\b(dc-?e|dace|declara[cç][aã]o de conte[uú]do eletr[oô]nica)\b", text, re.I):
            continue
        # Trecho exato da publicação, sem chamar toda notícia fiscal de atualização da DC-e.
        title = short(text.split(". ", 1)[0], 160)
        if not title or len(title) < 15:
            continue
        found.append((title, page_url, short(text, 330), date.isoformat()))
    return found[:8]

def parse_anfavea_articles(archive: bytes, base_url: str):
    """Seleciona releases com links próprios e extrai a data da página original."""
    parser = PageCollector()
    parser.feed(archive.decode("utf-8", "replace"))
    addresses = []
    for href, _label in parser.links:
        url = canonical(urllib.parse.urljoin(base_url, href))
        if url and re.search(r"/site/imprensa-noticia/[^/]+/?$", url) and url not in addresses:
            addresses.append(url)
    result = []
    for url in addresses[:8]:
        try:
            page = fetch(url, max_bytes=950_000).decode("utf-8", "replace")
            meta = PageCollector()
            meta.feed(page)
            title = next((value for tag, value in meta.headings if tag == "h1"), "")
            raw = plaintext(page)
            match = re.search(r"(?<!\d)(\d{2}/\d{2}/20\d{2})(?!\d)", raw)
            date = valid_article_date(match.group(1)) if match else None
            if not title or date is None:
                continue
            body = raw[match.end():] if match else ""
            result.append((title, url, short(body, 260), date.isoformat()))
        except Exception as exc:
            print(f"[AVISO] release Anfavea {url}: {exc}", file=sys.stderr)
    return result

def relevant_article(title: str, excerpt: str, url: str):
    if not is_relevant(title, excerpt):
        return False
    # Páginas de avisos da SVRS só entram se tratarem especificamente de DC-e/DACE.
    if "/Dce/" in url and not re.search(r"\b(dc-?e|dace|declara[cç][aã]o de conte[uú]do eletr[oô]nica)\b", title + " " + excerpt, re.I):
        return False
    return True

def update():
    existing = json.loads(OUT.read_text("utf-8")) if OUT.exists() else {"articles": []}
    prior = {canonical(x.get("url", "")): x for x in existing.get("articles", []) if canonical(x.get("url", ""))}
    now = dt.date.today()
    cutoff = now - dt.timedelta(days=105)
    total_entries = 0
    successes = []
    fresh = {}
    for label, feed in FEEDS:
        try:
            entries = parse_feed(fetch(feed))
            if not entries:
                raise ValueError("Feed sem itens")
            successes.append({"source": label, "entries": len(entries)})
            total_entries += len(entries)
        except Exception as exc:
            print(f"[AVISO] {label}: {exc}", file=sys.stderr)
            continue
        for title, url, excerpt_html, date_str in entries:
            url = canonical(url)
            date = parse_date(date_str)
            title = plaintext(title)
            intro = short(excerpt_html, 260)
            if not url or not date or not (cutoff <= date <= now) or not title:
                continue
            if not relevant_article(title, intro, url):
                continue
            previous = prior.get(url, {})
            if url in fresh:
                continue
            category, attention = categorise(title, intro)
            # Conserva a explicação revisada manualmente para a notícia já conferida.
            if previous.get("verified") and previous.get("summary") and previous.get("impact"):
                summary, impact = previous["summary"], previous["impact"]
                image = previous.get("image") or ""
                cat = previous.get("category") or category
                verified = True
            else:
                summary = intro or title
                impact = attention
                cat = category
                image = ""
                verified = False  # extrato automático da fonte, não revisado editorialmente
            fresh[url] = {
                "id": previous.get("id") or __import__("hashlib").sha256(url.encode()).hexdigest()[:16],
                "title": title[:180],
                "source": ("Receita Federal" if "receitafederal" in url else
                           "Portal Nacional da NFS-e" if "/nfse/" in url else
                           "Agência Brasil (EBC)" if "agenciabrasil.ebc.com.br" in url else
                           "Anfavea" if "anfavea.com.br" in url else
                           "Ministério dos Transportes" if "/transportes/" in url else
                           "MDIC" if "/mdic/" in url else "Ministério da Fazenda"),
                "published": date.isoformat(), "category": cat,
                "summary": summary[:340], "impact": impact[:310],
                "url": url, "image": image, "verified": verified,
            }

    # Busca direcionada: DC-e/DACE no portal autorizador e montadoras na Anfavea.
    for label, page_url, page_type in SITE_PAGES:
        try:
            body = fetch(page_url)
            if page_type == "dce":
                entries = parse_dce_bulletins(body, page_url)
            else:
                entries = parse_anfavea_articles(body, page_url)
            if not entries:
                raise ValueError("Página sem notícia datada e pertinente")
            successes.append({"source": label, "entries": len(entries)})
            total_entries += len(entries)
        except Exception as exc:
            print(f"[AVISO] {label}: {exc}", file=sys.stderr)
            continue
        for title, url, excerpt, raw_date in entries:
            url = canonical(url)
            date = parse_date(raw_date)
            if not url or not date or not (cutoff <= date <= now):
                continue
            title = plaintext(title)
            intro = short(excerpt, 260)
            if not relevant_article(title, intro, url):
                continue
            if url in fresh:
                continue
            previous = prior.get(url, {})
            category, attention = categorise(title, intro)
            if page_type == "dce":
                category, attention = CATEGORIES[0][0], CATEGORIES[0][2]
            if page_type == "automotive":
                category, attention = CATEGORIES[1][0], CATEGORIES[1][2]
            revised = previous.get("verified") and previous.get("summary") and previous.get("impact")
            fresh[url] = {
                "id": previous.get("id") or __import__("hashlib").sha256((url + date.isoformat()).encode()).hexdigest()[:16],
                "title": title[:180],
                "source": "Portal DC-e (SVRS)" if page_type == "dce" else "Anfavea",
                "published": date.isoformat(), "category": previous.get("category", category) if revised else category,
                "summary": previous["summary"] if revised else (intro or title)[:340],
                "impact": previous["impact"] if revised else attention[:310],
                "url": url, "image": previous.get("image", ""), "verified": bool(revised),
            }
    if not successes:
        raise RuntimeError("Nenhuma fonte pôde ser consultada. Mantida a última edição válida.")
    # Junta lançamentos novos e os curados; não deixa notícias antigas sumirem sem motivo.
    merged = dict(prior)
    merged.update(fresh)
    all_recent = sorted(
        (item for item in merged.values() if parse_date(item.get("published")) and
         cutoff <= parse_date(item.get("published")) <= now and canonical(item.get("url"))),
        key=lambda x: (x["published"], x["title"]), reverse=True,
    )
    # Garante visibilidade para as duas novas editorias quando existirem matérias verificáveis.
    selected = []
    for category in ("DCEs", "Montadoras"):
        selected.extend(item for item in all_recent if item["category"] == category)  # priorização temática
        selected = selected[:12]
    for item in all_recent:
        if item not in selected:
            selected.append(item)
        if len(selected) >= 32:
            break
    chosen = sorted(selected[:32], key=lambda x: (x["published"], x["title"]), reverse=True)
    # Imagens somente de fontes oficiais e apenas para os primeiros destaques.
    for item in chosen[:7]:
        if not item.get("image"):
            item["image"], _ = related_image(item["url"])
    if not chosen:
        raise RuntimeError("Fontes consultadas, mas nenhuma notícia fiscal recente encontrada. Preservado JSON anterior.")
    payload = {
        "schema_version": 1, "researched_at": now.isoformat(),
        "source_status": "atualizacao_automatica_de_feeds_oficiais",
        "sources_checked": successes, "entries_scanned": total_entries,
        "articles": chosen,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"{len(successes)} fontes disponíveis; {total_entries} entradas lidas; {len(chosen)} notícias relevantes publicadas")

def self_test():
    atom = b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>NF-e altera regra</title><link rel="alternate" href="https://www.gov.br/nfse/pt-br/teste"/><summary>Resumo da NF-e</summary><published>2026-11-16T10:00:00-03:00</published></entry></feed>'
    rss = b'<rss><channel><item><title>CT-e</title><link>https://www.gov.br/x</link><description>Documentos fiscais</description><pubDate>Mon, 16 Nov 2026 10:00:00 -0300</pubDate></item></channel></rss>'
    assert len(parse_feed(atom)) == 1
    assert len(parse_feed(rss)) == 1
    assert parse_date("2026-11-16T10:00:00-03:00") == dt.date(2026, 11, 16)
    assert parse_date("Mon, 16 Nov 2026 10:00:00 -0300") == dt.date(2026, 11, 16)
    assert canonical("http://example.org/malicioso") == ""
    assert canonical("https://www.gov.br.evil.test/x") == ""
    assert canonical("https://www.gov.br/nfse/pt-br/noticias/?x=1") == "https://www.gov.br/nfse/pt-br/noticias"
    assert is_relevant("Nota Técnica NFS-e", "Nova regra") is True
    assert is_relevant("Operação Fronteira: apreensão de cigarros", "Polícia") is False
    assert categorise("CT-e novo leiaute", "")[0] == "Transporte"
    assert categorise("Regra C02-30 da DC-e", "DACE") [0] == "DCEs"
    assert categorise("Produção de veículos cresce, Anfavea anuncia", "")[0] == "Montadoras"
    assert is_relevant("Montadoras ampliam produção", "") is True
    assert is_relevant("DC-e recebe nota técnica", "") is True
    assert canonical("https://dfe-portal.svrs.rs.gov.br/Dce/Avisos/3009") != ""
    assert canonical("https://anfavea.com.br/site/imprensa-noticia/teste/") != ""
    sample = b"<section>06/10/2026 <h2>AVISO: ValidaÃ§Ã£o da DC-e</h2><p>A regra C02-30 verifica o CNPJ informado.</p></section>"
    assert len(parse_dce_bulletins(sample, "https://dfe-portal.svrs.rs.gov.br/Dce/Avisos")) == 1
    print("self-test: OK")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        update()
