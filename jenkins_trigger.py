import urllib.request
import http.cookiejar
import base64
import re
url = 'http://localhost:8082'
user = 'copilotadmin'
passwd = 'admin12345'
credentials = (user + ':' + passwd).encode('utf-8')
headers = {'Authorization': 'Basic ' + base64.b64encode(credentials).decode('ascii')}
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
req = urllib.request.Request(url + '/crumbIssuer/api/xml', headers=headers)
with opener.open(req, timeout=20) as resp:
    xml = resp.read().decode('utf-8')
print(xml)
m = re.search(r'<crumb>([^<]+)</crumb>', xml)
if not m:
    raise SystemExit('crumb not found')
crumb = m.group(1)
print('crumb=' + crumb)
req = urllib.request.Request(url + '/job/DevOpsProject/build', headers={**headers, 'Jenkins-Crumb': crumb}, method='POST')
with opener.open(req, timeout=20) as resp:
    print('status', resp.status)
    print(resp.read().decode('utf-8'))
