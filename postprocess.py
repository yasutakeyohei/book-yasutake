import glob
import re
import shutil
import os
import datetime

from datetime import datetime as dt

description =""
def cutDesc(match):
    global description
    description = match.groups()[0]
    return ""

removeIndexRe1 = r"(href\s*?\=\s*?\")index\.html(.*?\")"
subst1 = "\\1./\\2"

removeIndexRe2 = r"(href\s*?\=\s*?\")(.*?)\/index\.html(.*?\")"
subst2 = "\\1\\2/\\3"

descriptionRe = r"<p>.*?{{description:(.*)}}.*?</p>"

# index.htmlの削除
for filepath in glob.iglob('../../book/**/*.html', recursive=True):
    filepath = os.path.normpath(filepath)

    if(os.sep == "/") :
        fp = re.sub(r"../../book/html/(.+)/.html", "\\1.md", filepath, 0)
    else :
        fp = re.sub(r"..\\..\\book\\html\\(.+)\.html", "\\1.md", filepath, 0)
        fp = fp.replace("\\", "/")

    githubp = "https://github.com/yasutakeyohei/Reiwa2/commits/master/src/" + fp
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

    description = ""
    s = re.sub(r"<p>.*{{description:(.*)}}.*</p>", cutDesc, s, 0)
    if (description != "") :
        meta = f'<meta name="description" content="{description}">'
        s = s.replace("<!-- yield meta description here -->", meta, 1)

    if key != "" :
        replace = '''
            <ul class="published-at-updated-at">
                <li><a href="{githubp}"><i class="fa fa-refresh" aria-hidden="true" title="更新日"></i> <time datetime="{keyGTM}" timeprop="modified" title="更新日">{key}</a></time></li>
                <li><i class="fa fa-file-text-o" aria-hidden="true" title="公開日"></i> <time datetime="\\1" timeprop="datepublished" title="公開日">\\1</time></li>
            </ul>
        '''.format(keyGTM = keyGTM, key = key, githubp = githubp)
        s = re.sub(r"<p>.*{{first:(.*)}}.*</p>", replace, s, 0)
    
    with open(filepath, "w", encoding="utf8") as file:
        file.write(s)

# 個別ページ用javascriptディレクトリのコピー
shutil.copytree('../../js-each/','../../book/html/js-each/')

#個別ページ用CSSディレクトリのコピー
shutil.copytree('../../css-each/','../../book/html/css-each/')


