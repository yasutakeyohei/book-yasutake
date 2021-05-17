import glob
import re
import shutil
import os
import datetime

from datetime import datetime as dt

matchedStr =""
def getMatched(match):
    global matchedStr
    matchedStr = match.groups()[0]
    return ""

removeIndexRe1 = r"(href\s*?\=\s*?\")index\.html(.*?\")"
subst1 = "\\1./\\2"

removeIndexRe2 = r"(href\s*?\=\s*?\")(.*?)\/index\.html(.*?\")"
subst2 = "\\1\\2/\\3"

descriptionRe = r"<p>.*?{{description:(.*)}}.*?</p>"

# index.htmlの削除、更新時間等置き換え
for filepath in glob.iglob('../../book/**/*.html', recursive=True):
    filepath = os.path.normpath(filepath)

    if(os.sep == "/") :
        fp = re.sub(r"../../book/html/(.+)/.html", "\\1.md", filepath, 0)
    else :
        fp = re.sub(r"..\\..\\book\\html\\(.+)\.html", "\\1.md", filepath, 0)
        fp = fp.replace("\\", "/")

    githubp = "https://github.com/yasutakeyohei/book-yasutake/commits/master/src/" + fp
    fp = "../../src/" + fp
    # print(fp)
    # print(githubp)

    key = ""
    if os.path.exists(fp) :
        dt = datetime.datetime.fromtimestamp(os.stat(fp).st_mtime)
        keyGTM = dt.strftime('%Y-%m-%dT%H:%M:%S+09:00')
        key = dt.strftime('%Y-%m-%d')

    with open(filepath, encoding="utf8") as file:
        s = file.read()

    s = re.sub(removeIndexRe1, subst1, s, 0) #"index.html"の削除
    s = re.sub(removeIndexRe2, subst2, s, 0) #"~/~/index.html"の削除

    matchedStr = ""
    s = re.sub(r"<p>.*{{description:(.*)}}.*</p>", getMatched, s, 0)
    if (matchedStr != "") :
        meta = f'<meta name="description" content="{matchedStr}">'
        s = s.replace("<!-- yield meta description here -->", meta, 1)
        meta = f'<meta property="og:description" content="{matchedStr}" />'
        s = s.replace("<!-- yield og:description here -->", meta, 1)

    matchedStr = ""
    s = re.sub(r"<p>.*{{og-image:\s*(.*)}}.*</p>", getMatched, s, 0)

    if (matchedStr != "") :
        imageURL, w, h = [x.strip() for x in matchedStr.split(',')]
        meta = '''<meta property="og:image" content="{imageURL}" />
        <meta property="og:image:secure_url" content="{imageURL}" />
        <meta property="og:image:width" content="{w}" />
        <meta property="og:image:height" content="{h}" />'''.format(imageURL = imageURL, w = w, h = h)
        s = s.replace("<!-- yield og:image:* here -->", meta, 1)

    if key != "" :
        replace = '''
            <ul class="published-at-updated-at">
                <li><a href="{githubp}"><i class="fa fa-refresh" aria-hidden="true" title="更新日"></i> <time datetime="{keyGTM}" timeprop="modified" title="更新日">{key}</a></time></li>
                <li><i class="fa fa-file-text-o" aria-hidden="true" title="公開日"></i> <time datetime="\\1" timeprop="datepublished" title="公開日">\\1</time></li>
            </ul>
            <!-- <lastmod>{keyGTM}</lastmod> -->
        '''.format(keyGTM = keyGTM, key = key, githubp = githubp)
        s = re.sub(r"<p>.*{{first:(.*)}}.*</p>", replace, s, 0)
    
    with open(filepath, "w", encoding="utf8") as file:
        file.write(s)

# sitemap作成
sitemap = []
sitemap.append('<?xml version="1.0" encoding="UTF-8"?>\n')
sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n\n')

for filepath in glob.iglob('../../book/**/*', recursive=True):
    filepath = os.path.normpath(filepath)
    if(not re.match(r".*\.(html|docx|xlsx|txt|svg)$", filepath)) :
        continue
    if(re.match(r"..(/|\\)..(/|\\)book(/|\\)html(/|\\)(src(/|\\)|fonts(/|\\)|FontAwesome(/|\\)|theme|404\.html$|favicon\.svg$)", filepath)) :
        continue
    if(os.sep == "/") :
        fp = re.sub(r"../../book/html/(.+)", "\\1", filepath, 0)
    else :
        fp = re.sub(r"..\\..\\book\\html\\(.+)", "\\1", filepath, 0)
        fp = fp.replace("\\", "/")
    srcfp = "../../src/" + fp.replace(".html", ".md")

    url = "https://yasutakeyohei.com/books/yasutake/" + fp.replace("index.html", "")

    key = ""
    if os.path.exists(srcfp) :
        dt = datetime.datetime.fromtimestamp(os.stat(srcfp).st_mtime)
        keyGTM = dt.strftime('%Y-%m-%dT%H:%M:%S+09:00')
        # key = dt.strftime('%Y-%m-%d')

        sitemap.append("<url>\n")
        sitemap.append("<loc>" + url + "</loc>\n")
        sitemap.append("<lastmod>" + keyGTM + "</lastmod>\n")
        sitemap.append("</url>\n")

sitemap.append("</urlset>")
with open("../html/sitemap.xml", "w", encoding="utf8") as file: # zからの相対パス指定
    file.writelines(sitemap)

# 個別ページ用javascriptディレクトリのコピー
#shutil.copytree('../../js-each/','../../book/html/js-each/')

#個別ページ用CSSディレクトリのコピー
#shutil.copytree('../../css-each/','../../book/html/css-each/')
