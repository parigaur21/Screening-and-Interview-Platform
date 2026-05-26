import urllib.request, base64, json
import time
url='http://localhost:8082'
auth=base64.b64encode(b'copilotadmin:admin12345').decode()
hdr={'Authorization':'Basic '+auth}
time.sleep(5)
req=urllib.request.Request(url+'/job/DevOpsProject/api/json?tree=lastBuild[number,url,result,building]',headers=hdr)
with urllib.request.urlopen(req,timeout=20) as resp:
    data=json.load(resp)
print(data)
