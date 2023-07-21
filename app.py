from flask import Flask, render_template, redirect, url_for, request
import requests
import json
import numexpr as ne

URLS = {
    "auth_url": 'https://auth.tangl.cloud/connect/token',
    "company_url": 'https://auth.tangl.cloud/api/app/company',
    "project_url": 'https://value.tangl.cloud/api/app/project',
    "analaysis_url": 'https://value.tangl.cloud/api/app/analysis',
    "odata_url": 'https://value.tangl.cloud/api/odata/UnionTree',
    "tree_url": 'https://cache.tangl.cloud/api/app/modelsCache',
    "params_url": 'https://cache.tangl.cloud/api/app/modelsCache',
}

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("login.html")

@app.route("/main")
def index2():
    return render_template("vor.html")


@app.route("/api/auth", methods=['POST'])
def auth():
    if request.method == "POST":
        login = request.form["login"]
        password = request.form["password"]
        head = {'Content-Type': 'application/x-www-form-urlencoded'}
        myobj = {'client_id': 'BimTanglValue_External', 'grant_type': 'password', 'username': login,
                 'password': password}
        req = requests.post(URLS["auth_url"], data=myobj, headers=head)
        res = req.json()
        create_json_file("auth.json", res)
        try:
            a_token = res["access_token"]
            return {"status": "success", "content": a_token}
        except:
            return {"status": "error", "content": res["error_description"]}


@app.route("/api/company", methods=['POST'])
def get_company():
    if request.method == "POST":
        auth_token = request.headers["Authorization"]
        res = get_attr(URLS["company_url"], auth_token)
        create_json_file("company.json", res)
        return res


@app.route("/api/projects", methods=['POST'])
def get_projects_list():
    if request.method == "POST":
        company_id = request.form["id"]
        url = URLS["project_url"] + "/" + company_id + "/byCompanyId"
        auth_token = request.headers["Authorization"]
        res = get_attr(url, auth_token)
        res = res if (res != "") else "error"
        create_json_file("projects.json", res)
        return res


@app.route("/api/data", methods=['POST'])
def get_data_list():
    if request.method == "POST":
        model_id = request.form["id"]
        url = URLS["analaysis_url"] + "/" + model_id + "/byModel"
        auth_token = request.headers["Authorization"]
        res = get_attr(url, auth_token)
        create_json_file("data.json", res)
        return res


@app.route("/api/odata", methods=['POST'])
def get_odata_list():
    if request.method == "POST":
        company_name = request.form["company_name"]
        project_name = request.form["project_name"]
        model_name = request.form["model_name"]
        union_tree_name = request.form["union_tree_name"]
        url = URLS["odata_url"] + "('" + company_name + "','" + project_name + "','" + model_name + "','" + union_tree_name + "')?parents" \
                                                                                                       "=true "
        auth_token = request.headers["Authorization"]
        odata = get_attr(url, auth_token)
        create_json_file("odata.json", odata)
        s_odata = structur_odata(odata["value"], 1, "")
        return s_odata


@app.route("/api/tree", methods=['POST'])
def get_tree():
    if request.method == "POST":

        model_id = request.form["id"]
        vor_groups = request.form['groups'].split(";")
        for i in range(len(vor_groups)):
            vor_groups[i] = vor_groups[i].split(":")
            name = vor_groups[i][0]
            elements = vor_groups[i][1]
            vor_groups[i] = {
                "name": name,
                "elements": elements.split(",")
            }
        url = URLS["tree_url"] + "/" + model_id + "/tree"
        auth_token = request.headers["Authorization"]
        tree = get_attr(url, auth_token)
        create_json_file("tree.json", tree)
        new_tree = {}
        for el in vor_groups:
            new_tree[el['name']] = {}
            for i in tree['metaTree']:
                for j in i["typeGroups"]:
                    if j['name'].split("_")[0] in el["elements"]:
                        new_tree[el['name']][j['name']] = j
        create_json_file("new_tree.json", new_tree)
        params = create_params_table(auth_token, new_tree, model_id)
        create_json_file("params.json", params)
        return params


# @app.route("/api/tree", methods=['POST'])
# def get_tree():
#     if request.method == "POST":
#
#         model_id = request.form["id"]
#         vor_group = request.form['group']
#         vor_group = vor_group.split(":")
#         vor_group = {
#             "name": vor_group[0],
#             "elements": vor_group[1].split(",")
#         }
#         url = URLS["tree_url"] + "/" + model_id + "/tree"
#         auth_token = request.headers["Authorization"]
#         tree = get_attr(url, auth_token)
#         create_json_file("tree.json", tree)
#         new_tree = {}
#
#         new_tree[vor_group['name']] = {}
#         for i in tree['metaTree']:
#             for j in i["typeGroups"]:
#                 if j['name'].split("_")[0] in vor_group["elements"]:
#                     new_tree[vor_group['name']][j['name']] = j
#         create_json_file("new_tree.json", new_tree)
#         params = create_params_table(auth_token, new_tree, model_id)
#         create_json_file("params.json", params)
#         return params


@app.route("/api/convertToExpression", methods=['POST'])
def convert_expression():
    if request.method == "POST":
        expression = request.form["expression"]
        s = request.form["dict"]
        s = s.replace(",", ".")
        s = s[0:-1]
        s = s.split(";")
        d = {}

        for i in range(len(s)):
            el = s[i].split(":")
            d[el[0]] = float(el[1])
        result = ne.evaluate(expression, local_dict=d)
        return str(result).replace(".", ",")


@app.route("/api/getLevels", methods=['POST'])
def get_levels():
    if request.method == "POST":
        model_id = request.form["id"]
        url = URLS["tree_url"] + "/" + model_id + "/tree"
        auth_token = request.headers["Authorization"]
        tree = get_attr(url, auth_token)
        levels = set()
        for i in tree['metaTree']:
            if i["name"] == "Уровни":
                for j in i["typeGroups"]:
                    if j["name"] == "ADSK_Стрелка_Проектная_Вверх_Имя уровня":
                        for k in j["elements"]:
                            levels.add(k["name"])
                return str(sorted(levels))


@app.route("/api/getTreeEl", methods=['POST'])
def get_tree_elem():
    if request.method == "POST":
        model_id = request.form["id"]
        el_name = request.form["elem"]
        url = URLS["tree_url"] + "/" + model_id + "/tree"
        auth_token = request.headers["Authorization"]
        tree = get_attr(url, auth_token)

        for i in tree['metaTree']:
            for j in i["typeGroups"]:
                if j['name'].split("_")[0] == el_name:
                    res = {}
                    for k in j["elements"]:
                        pars = get_params(auth_token, model_id, k["elNum"])
                        lvl_name = pars["meta"]["Meta"]["Element"]["Pars"]["Уровень"]["Name"]
                        res[lvl_name] = res.get(lvl_name, 0) + 1
                    return str(res)


def structur_odata(data: list, num: int, last_key) -> dict:
    d = {}
    if len(data) != 0:
        elements = []
        for el in data:
            code = el["Code"]
            if len(code.split(".")) == num and code.startswith(last_key):
                elements.append(el)
        if len(elements) == 0:
            return {}
        else:
            for i in elements:
                data.remove(i)
                d[i["Code"]] = {}
                d[i["Code"]]["Name"] = i["Name"]
                elements = []
                for el in data:
                    code = el["Code"]
                    if len(code.split(".")) == num + 1 and code.startswith(i["Code"]):
                        elements.append(el)
                if len(elements) == 0:
                    d[i["Code"]]["Elements"] = {"value": i["Value"]}
                else:
                    d[i["Code"]]["Elements"] = structur_odata(data, num+1, i["Code"])
    return d


def create_params_table(auth_token: str, elements: dict, model_id: str) -> dict:
    params_meta = {}
    for i in elements:
        params_meta[i] = {}
        for j in elements[i]:
            url = URLS['params_url'] + '/' + model_id + '?elNum=' + str(elements[i][j]['elements'][0]['elNum'])
            params_meta[i][j.split("_")[0]] = get_attr(url, auth_token)
            params_meta[i][j.split("_")[0]]['meta'] = json.loads(params_meta[i][j.split("_")[0]]['meta'])

    return params_meta


def get_params(auth_token: str, model_id: str,  elNum: int) -> dict:
    url = 'https://cache.tangl.cloud/api/app/modelsCache/'+model_id+'?elNum=' + str(elNum)
    params_meta = get_attr(url, auth_token)
    params_meta['meta'] = json.loads(params_meta['meta'])
    return params_meta




def get_attr(url: str, auth_token: str) -> dict:
    head = {'Content-Type': 'text/plain', "Authorization": "Bearer " + auth_token}
    req = requests.get(url, headers=head)
    try:
        res = req.json()
    except:
        res = req.text

    return res

def create_json_file(filename: str, data: dict):
    with open(filename, 'w', encoding='utf-8') as outfile:
        json.dump(data, outfile, indent=4, ensure_ascii=False)






def main():
    app.run(debug=True)




if __name__ == "__main__":
    main()