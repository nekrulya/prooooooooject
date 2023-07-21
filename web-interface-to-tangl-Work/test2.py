import requests
import json

URLS = {
    "auth_url": 'https://auth.tangl.cloud/connect/token',
    "company_url": 'https://auth.tangl.cloud/api/app/company',
    "project_url": 'https://value.tangl.cloud/api/app/project',
    "analaysis_url": 'https://value.tangl.cloud/api/app/analysis',
    "odata_url": 'https://value.tangl.cloud/api/odata/UnionTree',
    "tree_url": '',
    "params_url": '',
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

url = "https://cache.tangl.cloud/api/app/modelsCache/d7ab1e9e-7e68-6b4f-e8b1-3a0a91627c85/index"
params = get_attr(url, auth_token)
create_json_file("test.json", params)


# d= {}
# with open("res.txt", mode="w", encoding="utf-8") as file:
#     for i in tree["metaTree"]:
#         d[i["name"]] = {}
#         file.write("++++++++++++++++++++++\n")
#         file.write(i["name"] + "\n")
#         file.write("++++++++++++++++++++++\n")
#         for j in i["typeGroups"]:
#             file.write(j["name"] + "\n")
#             file.write("______________________\n")
