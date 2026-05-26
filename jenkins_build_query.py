import urllib.request
import base64
import json
url='http://localhost:8082'
auth=base64.b64encode(b'copilotadmin:admin12345').decode()
hdr={'Authorization':'Basic '+auth}
req=urllib.request.Request(url+'/job/DevOpsProject/api/json',headers=hdr)
with urllib.request.urlopen(req,timeout=20) as resp:
    data=json.load(resp)
print(data['lastBuild']['number'])
print(data['lastBuild']['url'])
