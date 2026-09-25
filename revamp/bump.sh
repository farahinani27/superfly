#!/bin/sh
# dev helper: bump ?v= on local css/js so the browser cannot serve stale files
python3 - "$@" <<'PY'
import re, time
p = 'index.html'
s = open(p).read()
v = str(int(time.time()))
s = re.sub(r'(href="(?:css)/[^"?]+\.css)(\?v=\d+)?"', r'\1?v=' + v + '"', s)
s = re.sub(r'(src="(?:js)/[^"?]+\.js)(\?v=\d+)?"',  r'\1?v=' + v + '"', s)
open(p, 'w').write(s)
print('cache-bust v=' + v)
PY
