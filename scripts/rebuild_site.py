from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BFQ_DIR = ROOT / "BFQ"
CATALOG_PATH = ROOT / "static" / "js" / "catalog.js"


SITE = {
    "name": "德云相声博物馆",
    "tagline": "以更轻的界面，留住更厚的包袱。",
    "description": (
        "一个更现代、更简约也更实用的相声馆首页。"
        "按演员浏览馆藏，按段子直达播放，让传统曲艺以更舒服的方式被听见。"
    ),
    "footer": "馆藏内容仅作个人整理与学习交流使用。",
}


ARTISTS = [
    {
        "key": "gdg",
        "folder": "GDG",
        "page": "GDG.html",
        "name": "郭德纲 于谦",
        "duo": "郭德纲 / 于谦",
        "portrait": "static/picture/show-1.png",
        "cover": "static/picture/playlist-banner-bg-1.png",
        "accent": "#9f2d20",
        "muted": "#ead8c8",
        "city": "天津 · 北京",
        "tagline": "台柱气定神闲，包袱铺陈见功力。",
        "description": (
            "郭德纲，天津人，祖籍山西汾阳，中国相声演员，亦曾出演影视剧，以及多档电视节目主持人，北京德云社创始人之一。"
            " 于谦，中国相声演员、影视剧演员，出生于北京市，祖籍陕西蓝田，德云社成员，北京马术文化节儿童马术推广大使。"
        ),
        "highlights": ["我要反三俗", "西征梦", "论捧逗", "扒马褂"],
        "tags": ["经典馆藏", "台柱搭档", "长篇耐听"],
    },
    {
        "key": "yyp",
        "folder": "YYP",
        "page": "YYP.html",
        "name": "岳云鹏 孙悦",
        "duo": "岳云鹏 / 孙越",
        "portrait": "static/picture/show-2.png",
        "cover": "static/picture/playlist-banner-bg-2.png",
        "accent": "#b5532f",
        "muted": "#efe0d1",
        "city": "河南 · 北京",
        "tagline": "节奏明快，亲和力强，流行感十足。",
        "description": (
            "岳云鹏，本名岳龙刚，艺名云鹏。河南濮阳南乐县人，中国内地相声、影视男演员。"
            " 孙越，1979年出生于北京市，中国内地相声演员，2010年加入北京德云社，与岳云鹏搭档并主攻捧哏。"
        ),
        "highlights": ["五环之歌", "学歌曲", "满洲话", "妙言趣语"],
        "tags": ["国民搭档", "舞台热场", "轻松入门"],
    },
    {
        "key": "gf",
        "folder": "GF",
        "page": "GF.html",
        "name": "高峰 栾云平",
        "duo": "高峰 / 栾云平",
        "portrait": "static/picture/show-3.png",
        "cover": "static/picture/playlist-banner-bg-5.png",
        "accent": "#7a3728",
        "muted": "#efe3d7",
        "city": "天津 · 北京",
        "tagline": "规矩扎实，传统底子浓，文哏见长。",
        "description": (
            "高峰，1983年出生于天津市，中国内地相声演员，传统功底深厚。"
            " 栾云平，本名栾博，1984年出生于北京市，中国内地相声演员、影视演员、主持人，现任德云社演出部副总经理。"
        ),
        "highlights": ["卖布头", "学外语", "托妻献子", "金刚腿"],
        "tags": ["传统骨架", "文本密度高", "老段子耐品"],
    },
    {
        "key": "gql",
        "folder": "GQL",
        "page": "GQL.html",
        "name": "郭麒麟 阎鹤祥",
        "duo": "郭麒麟 / 阎鹤祥",
        "portrait": "static/picture/show-4.png",
        "cover": "static/picture/playlist-banner-bg-7.png",
        "accent": "#92553b",
        "muted": "#f0e4d5",
        "city": "天津 · 北京",
        "tagline": "年轻表达里带着老派章法，轻巧又稳。",
        "description": (
            "郭麒麟，本名郭奇林，1996年出生于天津市，中国内地相声、影视男演员。"
            " 阎鹤祥，本名阎鑫，1981年出生于北京市，中国内地男演员、相声演员、德云社演出四队队长。"
        ),
        "highlights": ["口吐莲花", "八扇屏", "黄鹤楼", "打灯谜"],
        "tags": ["少班主搭档", "节奏轻灵", "新旧兼容"],
    },
    {
        "key": "zhl",
        "folder": "ZHL",
        "page": "ZHL.html",
        "name": "张鹤伦 郎鹤炎",
        "duo": "张鹤伦 / 郎鹤炎",
        "portrait": "static/picture/show-5.png",
        "cover": "static/picture/playlist-banner-bg-6.png",
        "accent": "#8b3f2f",
        "muted": "#f1e1d1",
        "city": "黑龙江 · 北京",
        "tagline": "唱段活泛，舞台气息热，包袱带着民间烟火。",
        "description": (
            "张鹤伦，本名张立民，1985年出生于黑龙江省伊春市，中国内地相声演员、歌手，德云社演出六队队长。"
            " 郎鹤炎，本名郎晨，1981年出生于北京，兼具学院背景与舞台经验，是张鹤伦的重要搭档。"
        ),
        "highlights": ["口吐莲花", "劳动号子", "学歌曲", "幸福生活"],
        "tags": ["唱段见长", "舞台热闹", "烟火气"],
    },
    {
        "key": "mht",
        "folder": "MHT",
        "page": "MHT.html",
        "name": "孟鹤堂 周九良",
        "duo": "孟鹤堂 / 周九良",
        "portrait": "static/picture/show-6.png",
        "cover": "static/picture/playlist-banner-bg-8.png",
        "accent": "#6e3c2d",
        "muted": "#f3e7da",
        "city": "哈尔滨 · 南京",
        "tagline": "新生代代表，气质松弛，完成度很高。",
        "description": (
            "孟鹤堂，本名孟祥辉，1988年出生于黑龙江省哈尔滨市阿城区，中国内地相声演员，现为北京德云社七队队长。"
            " 周九良，本名周航，1994年出生于江苏南京，中国相声演员、德云七队相声演员。"
        ),
        "highlights": ["黄鹤楼", "学歌曲", "学评书", "我要幸福"],
        "tags": ["新生代", "松弛感", "舞台完成度高"],
    },
    {
        "key": "xdl",
        "folder": "XDL",
        "page": "XDL.html",
        "name": "徐德亮 王文林",
        "duo": "徐德亮 / 王文林",
        "portrait": "static/picture/show-7.png",
        "cover": "static/picture/playlist-banner-bg-9.png",
        "accent": "#6c4534",
        "muted": "#efe6dd",
        "city": "北京",
        "tagline": "书卷气和老派路数并存，听感很有辨识度。",
        "description": (
            "徐德亮，北京大学中文系古典文献专业出身，相声演员，被誉为传统与现代结合的另类。"
            " 王文林，1947年出生，北京人，中国相声演员，师从相声大师刘宝瑞。"
        ),
        "highlights": ["歪批三国", "卖估衣", "文昭关", "五行诗"],
        "tags": ["书卷气", "传统文本", "别样风格"],
    },
    {
        "key": "cj",
        "folder": "CJ",
        "page": "CJ.html",
        "name": "曹云金 刘云天",
        "duo": "曹云金 / 刘云天",
        "portrait": "static/picture/show-9.png",
        "cover": "static/picture/playlist-banner-bg-10.png",
        "accent": "#a54731",
        "muted": "#f0dfcf",
        "city": "天津",
        "tagline": "爆发力足，节奏快，擅长把舞台炒热。",
        "description": (
            "曹云金，1986年出生于天津，相声演员，2002年拜师郭德纲学习相声艺术，后与刘云天搭档。"
            " 刘云天，本名刘艺，1983年出生于天津市，毕业于中国戏曲学院，擅长舞台配合与捧哏节奏。"
        ),
        "highlights": ["黄鹤楼", "猜灯谜", "大保镖", "说学逗唱"],
        "tags": ["爆发力", "快节奏", "舞台感强"],
    },
    {
        "key": "hw",
        "folder": "HW",
        "page": "HW.html",
        "name": "何云伟 李菁",
        "duo": "何云伟 / 李菁",
        "portrait": "static/picture/show-10.png",
        "cover": "static/picture/playlist-banner-bg-11.png",
        "accent": "#7e4b35",
        "muted": "#f1e4d8",
        "city": "北京",
        "tagline": "早期搭档代表，口齿细密，传统味道浓。",
        "description": (
            "何云伟，1981年出生于北京市，中国内地相声演员、主持人，曾为郭德纲早期弟子。"
            " 李菁，1978年出生于北京，曲艺相声演员、影视演员，也是德云社早期重要成员。"
        ),
        "highlights": ["黄鹤楼", "对春联", "汾河湾", "八大吉祥"],
        "tags": ["早期馆藏", "传统味足", "口齿细密"],
    },
]


TRACK_PATTERN = re.compile(r"^(?P<number>\d+)(?P<title>《.*?》)(?P<performers>.*)$")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_track(path: Path, artist_key: str) -> dict[str, object]:
    stem = path.stem
    match = TRACK_PATTERN.match(stem)
    if match:
        title = match.group("title").strip("《》")
        performers = re.sub(r"\s+", " ", match.group("performers")).strip()
        number = int(match.group("number"))
    else:
        title = stem
        performers = ""
        number = 0

    track_id = f"{artist_key}-{slug(stem)}"
    return {
        "id": track_id,
        "number": number,
        "title": title,
        "performers": performers,
        "file": path.relative_to(ROOT).as_posix(),
    }


def collect_tracks(folder: str, artist_key: str) -> list[dict[str, object]]:
    track_dir = BFQ_DIR / folder
    tracks = [parse_track(path, artist_key) for path in sorted(track_dir.glob("*.mp3"))]
    return sorted(tracks, key=lambda item: (item["number"], item["title"]))


def pick_highlights(tracks: list[dict[str, object]], preferred: list[str]) -> list[dict[str, object]]:
    by_title = {track["title"]: track for track in tracks}
    selected: list[dict[str, object]] = []
    for title in preferred:
        track = by_title.get(title)
        if track and track not in selected:
            selected.append(track)
    for track in tracks:
        if len(selected) >= 4:
            break
        if track not in selected:
            selected.append(track)
    return selected


def build_catalog() -> dict[str, object]:
    performers: list[dict[str, object]] = []
    all_featured: list[dict[str, object]] = []

    for artist in ARTISTS:
        tracks = collect_tracks(artist["folder"], artist["key"])
        highlights = pick_highlights(tracks, artist["highlights"])
        performer = {
            **artist,
            "tracks": tracks,
            "trackCount": len(tracks),
            "featuredTrackIds": [track["id"] for track in highlights],
        }
        performers.append(performer)
        for track in highlights[:2]:
            all_featured.append(
                {
                    "artistKey": artist["key"],
                    "trackId": track["id"],
                }
            )

    total_tracks = sum(performer["trackCount"] for performer in performers)
    return {
        "site": {
            **SITE,
            "performerCount": len(performers),
            "trackCount": total_tracks,
            "featured": all_featured[:10],
        },
        "performers": performers,
    }


def write_catalog(catalog: dict[str, object]) -> None:
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    js = "window.DYS_DATA = " + json.dumps(catalog, ensure_ascii=False, indent=2) + ";\n"
    CATALOG_PATH.write_text(js, encoding="utf-8")


def page_html(title: str, description: str, page_config: dict[str, object]) -> str:
    page_json = json.dumps(page_config, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{description}">
  <title>{title}</title>
  <link rel="shortcut icon" type="image/x-icon" href="static/picture/favicon.png">
  <link rel="stylesheet" href="static/css/site.css">
</head>
<body>
  <div id="app"></div>
  <noscript>
    <div class="noscript">这个站点需要启用 JavaScript 才能显示新的馆藏界面。</div>
  </noscript>
  <script>window.DYS_PAGE = {page_json};</script>
  <script src="static/js/catalog.js"></script>
  <script src="static/js/site.js"></script>
</body>
</html>
"""


def write_pages(catalog: dict[str, object]) -> None:
    site_name = catalog["site"]["name"]
    home_description = catalog["site"]["description"]

    pages = {
        ROOT / "index.html": {
            "title": f"{site_name} | 馆藏首页",
            "description": home_description,
            "page": {"type": "home"},
        },
        ROOT / "role.html": {
            "title": f"{site_name} | 演员总览",
            "description": "按搭档浏览德云相声博物馆馆藏，快速进入不同演员页面与代表作品。",
            "page": {"type": "artists"},
        },
        ROOT / "404.html": {
            "title": f"{site_name} | 页面未找到",
            "description": "页面不存在，返回德云相声博物馆继续按演员和作品浏览。",
            "page": {"type": "404"},
        },
    }

    for performer in catalog["performers"]:
        pages[ROOT / performer["page"]] = {
            "title": f"{performer['name']} | {site_name}",
            "description": performer["description"],
            "page": {"type": "artist", "artistKey": performer["key"]},
        }

    for path, config in pages.items():
        path.write_text(page_html(config["title"], config["description"], config["page"]), encoding="utf-8")


def main() -> None:
    catalog = build_catalog()
    write_catalog(catalog)
    write_pages(catalog)
    print("Rebuilt catalog and page shells.")


if __name__ == "__main__":
    main()
