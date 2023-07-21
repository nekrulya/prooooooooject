import requests
import json

URLS = {
    "auth_url": 'https://auth.tangl.cloud/connect/token',
    "company_url": 'https://auth.tangl.cloud/api/app/company',
    "project_url": 'https://value.tangl.cloud/api/app/project',
    "analaysis_url": 'https://value.tangl.cloud/api/app/analysis',
    "odata_url": 'https://value.tangl.cloud/api/odata/UnionTree',
}



def auth():

    login = "rus.shestov2014@yandex.ru"
    password = "18052002Rust!"
    head = {'Content-Type': 'application/x-www-form-urlencoded'}
    myobj = {'client_id': 'BimTanglValue_External', 'grant_type': 'password', 'username': login,
             'password': password}
    req = requests.post(URLS["auth_url"], data=myobj, headers=head)
    res = req.json()
    a_token = res["access_token"]
    return a_token




def get_attr(url: str, auth_token: str) -> dict:
    head = {'Content-Type': 'text/plain', "Authorization": "Bearer " + auth_token}
    req = requests.get(url, headers=head)
    try:
        res = req.json()
    except:
        res = req.text

    return res


def create_params_table(auth_token: str, elNum: int) -> dict:
    url = 'https://cache.tangl.cloud/api/app/modelsCache/d7ab1e9e-7e68-6b4f-e8b1-3a0a91627c85?elNum=' + str(elNum)
    params_meta = get_attr(url, auth_token)
    params_meta['meta'] = json.loads(params_meta['meta'])
    return params_meta

def create_json_file(filename: str, data: dict):
    with open(filename, 'w', encoding='utf-8') as outfile:
        json.dump(data, outfile, indent=4, ensure_ascii=False)





url = "https://cache.tangl.cloud/api/app/modelsCache/d7ab1e9e-7e68-6b4f-e8b1-3a0a91627c85/tree"
auth_token = auth()
tree = get_attr(url, auth_token)
create_json_file("tree.json", tree)

d= {}
for i in tree["metaTree"]:
    for j in i["typeGroups"]:
        print(j["name"])
        d[j["name"]] = {}
        for k in j["elements"]:
            d[j["name"]][k["elNum"]] = create_params_table(auth_token, k["elNum"])
        create_json_file(j["name"] + ".json", d[j["name"]])