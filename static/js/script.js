let auth_token;
let company_id = $.cookie('company_id');
let company_name = $.cookie('company_name');
let project_list;
let project_name;
let model_id;
let model_name;
let directory_list;
let union_tree_name;
let odata;
let group;
let tree;
let table_groups_str;
let table_elements = new Map();
let chbx_id_str;
let chbx_id;
let ready_list_to_table = [];
let orders;

if ($.cookie('auth_token') != undefined){
    auth_token = $.cookie('auth_token');
    updateCompanySelect();
} else{
    window.location.pathname = "/"
}

$("#logOut").click(function(event){
    event.preventDefault();
    $.removeCookie('auth_token');
    window.location.pathname = "/";
});


class Property{

    constructor(id, name, path=[], group = false, parent = "", relation=[], visibility = true){
        this.id = id;
        this.name = name;
        this.nameToTable = name;
        this.path = path;
        this.group = group;
        this.parent = parent;
        this.relation = relation;
        this.visibility = visibility;
    }

    get parent(){
        return this._parent;
    }
    set parent(value){
        this._parent = value;
        this.group = (value != "") ? true : false;
    }

    getRelation(){
        return this.relation;
    }
    addRelation(value){
        this.relation.push(value);
    }
    removeRelation(value){
        let index = this.relation.findIndex(property => property == value);
        this.relation.splice(index, 1);
    }
    isContainRelation(){
        return (this.relation.length != 0) ? true : false;
    }

}
class Param extends Property{
    constructor(id, name, expression)
    {
        super(id, name);
        this.expression = expression;
    }
}
class Template extends Property{
    constructor(id, name, func, sup_val=""){
        super(id, name);
        this.func = func;
        this.sup_val = sup_val;
    }
}
class Group{
    constructor(id, name, childrens=[], group=false, parent=""){
        this.id = id;
        this.name = name;
        this.nameToTable = name;
        this.childrens = childrens;
        this.group = group;
        this.parent = parent;
    }

    get parent(){
        return this._parent;
    }
    set parent(value){
        this._parent = value;
        this.group = (value != "") ? true : false;
    }
    
    getChildren(value){
        return this.childrens[value];
    }
    addChildren(value){
        this.childrens.push(value);
    }
    removeChildren(value){
        let index = this.childrens.findIndex(property => property.id == value);
        this.childrens.splice(index, 1);
    }
}


function updateCompanySelect(){
    $.ajax({
        type: "POST",
        url: "/api/company",
        headers: {
            "Authorization": auth_token,
          },
        data: {},
        success: function (data) {
            if ($.cookie('company_id') == undefined || $.cookie('company_name') == undefined){
                company_id = data[0]["id"]
                $.cookie('company_id', company_id);
                company_name = data[0]["name"];
                $.cookie('company_name', company_name);
            }
            updateProjectSelect($.cookie('company_id'));
        }
    });
};

function updateProjectSelect(comp_id){
    
    $.ajax({
        type: "POST",
        url: "/api/projects",
        headers: {
            "Authorization": auth_token,
          },
        data: {'id': comp_id},
        success: function (data) {
            console.log(data);
            project_list = data;
            $('#project').empty();
            if ($.cookie('project_number') == undefined || $.cookie('project_name') == undefined){
                $("#project").append('<option disabled selected>Выберите проект</option>');
                for (let el in data){
                    $("#project").append(`<option value='${el}'>${data[el]["name"]}</option>`);
                }
            } else{
                $("#project").append('<option disabled>Выберите проект</option>');
                for (let el in data){
                    if ($.cookie('project_name') == data[el]["name"])
                        $("#project").append(`<option value='${el}' selected>${data[el]["name"]}</option>`);
                    else 
                        $("#project").append(`<option value='${el}'>${data[el]["name"]}</option>`);
                }
                updateModelSelect($.cookie('project_number'));
            }
        }
    });
}


$('#project').change(function(event){
    event.preventDefault();
    let project_number = $(this).val();
    project_name = $('#project option:selected').text();
    $.cookie('project_number', project_number);
    $.cookie('project_name', project_name);
    updateModelSelect(project_number);
});

function updateModelSelect(projNum){
    $('#model1').empty();
    console.log(project_list);
    let folders = project_list[projNum]["folders"];
    let html_text = "";
    for (el in folders){
        html_text += `
        <li class="model1__group">
            <div class="model1__group__title">
                <img src="../static/img/angle.png" alt="open list" class="open_list">
                <img src="../static/img/directory.png" alt="directory" class="directory__img">
                <span>${folders[el]["name"]}</span>
            </div>
            <ul>`
        for (id in folders[el]["models"]){
            html_text += `
            <li class="model__group__item">
                <img src="../static/img/document.png" alt="classficator__img" class="classficator__img">
                <span value="${folders[el]["models"][id]["id"]}">${folders[el]["models"][id]["name"]}</span>
            </li>`
        }
        html_text += `</ul></li>`
    }
    $('#model1').append(html_text);
    modal_flip_flop();
    updateUnionTreeSelect()
}




function updateUnionTreeSelect(){
    $('.model__group__item > span').click(function(event){
        event.preventDefault();
        model_id = $(this).attr("value");
        $.cookie('model_id', model_id);
        model_name = $(this).text();
        $.cookie('model_name', model_name);
        $.ajax({
            type: "POST",
            url: "/api/data",
            headers: {
                "Authorization": auth_token,
              },
            data: {'id': model_id},
            success: function (data) {
                console.log(data);
                $('#union_tree1').empty();
                $("#union_tree1").append('<option disabled selected>Выберите справочник</option>');
                for (id in data['catalogPrioritiesSchemes']){
                    $("#union_tree1").append(`<option value='${data['catalogPrioritiesSchemes'][id]['id']}'>${data['catalogPrioritiesSchemes'][id]['name']}</option>`);
                }
            }
    
        });
    });
    
}


$('#union_tree1').change(function(event){
    event.preventDefault();
    union_tree_name = $('#union_tree1 option:selected').text();
    $.cookie('union_tree_name', union_tree_name);
    updateVORTreeSelect($.cookie('company_name'), $.cookie('project_name'), $.cookie('model_name'), $.cookie('union_tree_name'));
});

function updateVORTreeSelect(companyName, projectName, modelName, unionTreeName){
    console.log(companyName, projectName, modelName, unionTreeName);
    $.ajax({
        type: "POST",
        url: "/api/odata",
        headers: {
            "Authorization": auth_token,
          },
        data: {'company_name': companyName, 'project_name': projectName, 'model_name': modelName, 'union_tree_name': unionTreeName},
        success: function (data) {
            odata = data;
            console.log(odata);
            $("#positions").empty();
            let html_text = "";
            for (let i in odata) {
                html_text += `
                <li class="positions__group">
                    <img src="../static/img/angle.png" alt="open list" class="open_list">
                    <span class="positions__group__text">${odata[i]["Name"]}</span>
                    <ul>`;
                for (let j in odata[i]["Elements"]) {
                    html_text += `
                    <li class="positions__podgroup">
                        <img src="../static/img/angle.png" alt="open list" class="open_list">
                        <span class="positions__podgroup__text">${odata[i]["Elements"][j]["Name"]}</span>
                        <ul class="overflow_hidden">`;
                    for (let k in odata[i]["Elements"][j]["Elements"]) {
                        html_text += `<li class="positions__item">${odata[i]["Elements"][j]["Elements"][k]["Name"]}</li>`;
                    }
                    html_text += `</ul></li>`;
                }
                html_text += `</ul></li>`;
            }
            $("#positions").append(html_text);
            modal_flip_flop();
            updateGroupElementsSelect();
        }
    });
}

function updateGroupElementsSelect(){
    $('.positions__item').click(function(event){
        event.preventDefault();
        let group = $(this).text();
        $.cookie('group', group);
        let vor_podgroupName = $(this).closest('ul').siblings(".positions__podgroup__text").text();
        let vor_groupName = $(this).closest('ul').siblings(".positions__podgroup__text").closest('ul').siblings(".positions__group__text").text();
        
        
        $.cookie('vor', vor_podgroupName);
        $.cookie('vor_groupName', vor_groupName);
        table_groups_str = "";
        for (let el in odata){
            if (odata[el]['Name'] == vor_groupName){
                let pod_groups = odata[el]['Elements'];
                for (let i in pod_groups){
                    if (pod_groups[i]["Name"] == vor_podgroupName){
                        let position = pod_groups[i]["Elements"]
                        for (let j in position){
                            if (position[j]["Name"] == group){
                                let elements = position[j]["Elements"];
                                table_groups_str += position[j]["Name"] + ":";
                                for (let k in elements){
                                    console.log(elements[k]["Name"]);
                                    table_groups_str += elements[k]["Name"] + ',';
                                }
                            }
                        };
                    }
                };
                
            };
        };
        table_groups_str = table_groups_str.substr(0, table_groups_str.length - 1);
        $.ajax({
            type: "POST",
            url: "/api/tree",
            headers: {
                "Authorization": auth_token,
              },
            data: {'id': $.cookie('model_id'), 'groups': table_groups_str},
            success: function (data) {
                tree = data;
                console.log(tree);
                chbx_id_str = "";
                chbx_id = 0;
                $('#propertie_to_table_list').empty();
                ready_list_to_table = [];
                $('#propertie_list').empty();
                
                console.log(tree[group]);

                for (i in tree[group]){
                    $('#propertie_list').append(get_list(tree[group][i]));
                    break;
                }
                    
                chbx_id_str = chbx_id_str.substr(0, chbx_id_str.length - 1);
                console.log(chbx_id_str.length);
                if (chbx_id_str.length > 0){
                    flipflop();
                    chbx_event();
                    updateLvl();
                }
                else{
                    alert("Упсс... Кажется не пришли свойства...");
                }
                propertie_list_to_table = [];
            }
        });
    });
}

$('#group_elements').change(function(event){
    event.preventDefault();
    
}); 

function get_list(data){
    let struct = "<ul>";
    for (i in data){

        if (typeof data[i] == "object"){
            struct += `<li><p class='toogle'>${i} <span>-</span></p>` + get_list(data[i]) + '</li>';
        }
        else{
            struct += `<li class='available_li'><label class="chbx_label"><input id='chbx${chbx_id}' type='checkbox' value='${i}' class='properties'><div class="checkmark"></div></label><span>${i}</span></li>`;
            chbx_id_str += `#chbx${chbx_id},`;
            chbx_id += 1;
        }     
    }
    struct += "</ul>"
    return struct;
}

function flipflop(){
    let col = document.getElementById("propertie_list").firstElementChild;
    col.addEventListener("click", function(event) {
        if (event.target.tagName == 'P'){
            if (event.target.nextElementSibling != null){
                event.target.nextElementSibling.classList.toggle('hidden');
                if (event.target.nextElementSibling.classList.contains('hidden')){
                    event.target.firstElementChild.innerHTML = "+";
                }
                else{
                    event.target.firstElementChild.innerHTML = "-";
                }
            }
        }
    });
}; 


function chbx_event(){
    $(chbx_id_str).change(function(event){
        event.preventDefault();
        let prop = $(this).val();
        let n = 0;
        while (ready_list_to_table.findIndex(property => property['name'] == prop + String(n)) != -1){n++;};
        prop = prop + String(n);
        let path = get_path($(this)[0]);
        
        if ($(this).is(':checked')){
            let elem = new Property($(this).prop("id"), prop, path);
            ready_list_to_table.push(elem);
        } else {
            
            index = ready_list_to_table.findIndex(property => property.id == $(this).prop("id"));
            let prp = ready_list_to_table[index];
            if (prp.group){
                index_gr = ready_list_to_table.findIndex(property => property.id == prp.parent);
                ready_list_to_table[index_gr].removeChildren(prp.id);
            };
            
            ready_list_to_table.splice(index, 1);
        }
        redraw_data_to_table();
    });

};


function get_path(element){
    let path = [element.value];
    while (element.closest('ul').previousElementSibling != null){
        element = element.closest('ul').previousElementSibling;
        path.push(element.innerText.substr(0, element.innerText.length - 2));
    }
    
    return path.reverse();
}

function getHTML_for_prop(id, name, HTMLclass){
    return `
    <div class="${HTMLclass}"  id="${id}">
        
        <div class="block_content">
            <div class="prop__block__header block__header">
                <p class="prop__name">${name}</p>
                <div class="del__prop__btn del__btn">
                    <img src='../static/img/delete.png' alt='delete'>
                </div>
            </div>
        </div>
        <div class="arrows">
            <div class="arrow btn_up" id="${id}"></div>
            <div class="arrow btn_down" id="${id}"></div>
        </div>
    </div>`;
}
function getHTML_for_group(id, name, childrens){
    return `
    <div class="group__prop__block" id="${id}">
        <div class="arrows group__arrows">
            <div class="arrow btn_up" id="${id}"></div>
            <div class="arrow btn_down" id="${id}"></div>
        </div>
        <div class="block_content">
            <div class="group__prop__block__header block__header">
                <p class="group__prop__name">${name}</p>
                <div class="ungroup__btn del__btn">
                <img src='../static/img/delete.png' alt='delete'>
                </div>
            </div>
            <div class="group__prop__childrens">${childrens}</div>
        </div>
    </div>`;
}

function redraw_data_to_table(){
    $('#propertie_to_table_list').empty();
    orders = "";
    console.log(ready_list_to_table);
    ready_list_to_table.forEach(function(item){
        if (item.id.startsWith("gr")){
            childrens = ""
            for (el in item.childrens){
                prop = item.getChildren(el)
                if (prop.id.startsWith("chbx") || prop.id.startsWith("tmpl"))
                    childrens += getHTML_for_prop(prop.id, prop.nameToTable, "prop__block__in__group");
                else if (prop.id.startsWith("param"))
                    childrens += getHTML_for_prop(prop.id, prop.nameToTable, "prop__block__in__group");
            }
            $('#propertie_to_table_list').append(getHTML_for_group(item.id, item.nameToTable, childrens));
                
        }
        else if ((item.id.startsWith("chbx") || item.id.startsWith("tmpl")) && !item.group){
            $('#propertie_to_table_list').append(getHTML_for_prop(item.id, item.nameToTable, "prop__block"));
        }
        else if (item.id.startsWith("param") && !item.group){
            $('#propertie_to_table_list').append(getHTML_for_prop(item.id, item.nameToTable, "prop__block"));
        }
    });  
    orders = orders.substr(0, orders.length - 1);    
    drag_prop_block();
    drop_group_prop_block();
    dblclk_to_rename();
    activate_ungrouping();
    del_prop_out_group();
    change_order();
    create_table();
    
}

function drag_prop_block(){
    $(".prop__block").draggable({
        revert: "invalid",
        axis: 'y',
        containment: "parent",
    });
}

function drop_group_prop_block(){
    $(".group__prop__block").droppable({
        drop: function (event, ui) {
            id = $(this).prop("id");
            index = ready_list_to_table.findIndex(property => property.id == ui.draggable[0]["id"]);
            ready_list_to_table[index].parent = id;

            index_gr = ready_list_to_table.findIndex(property => property.id == id);
            ready_list_to_table[index_gr].addChildren(ready_list_to_table[index]);

            redraw_data_to_table();
        }
    });
}



$('#add_prop_group').click(function(){
    add_group();
});

function add_group(group_name){
    let n = 0;
    let id;
    while (ready_list_to_table.findIndex(property => property['id'] == "gr" + String(n)) != -1){n++;};
    id = "gr" + String(n);
    let group = new Group(id, group_name ?? "Группа " + n)
    ready_list_to_table.push(group);
    redraw_data_to_table();
    return group;
}


function dblclk_to_rename(){
    $('.group__prop__name, .prop__name').dblclick(function(){
        // let val = $(this)[0].innerText;
        let id = $(this)[0].parentElement.parentElement.parentElement.id; // относительно тега <p> в котором хранится имя свойства/группы до основного блока <div>
        let prop = ready_list_to_table[ready_list_to_table.findIndex(property => property.id == id)];
        $(this).replaceWith(`<input type="text" id="rename" value="${prop.nameToTable}">`);
        $(document).keydown(function(event){
            if (event.keyCode == 27){
                redraw_data_to_table();
                $(document).off('keydown');
                return false;
            } else if(event.keyCode == 13) {
                rename(prop);
            }
        });
        
    });
}

function rename(propEl){

    if ($('#rename').val() != ""){
        let name = $('#rename').val();
        // if (!prop.id.startsWith("gr")){
        //     if (prop.isContainRelation()){
        //         let rel = prop.getRelation();
        //         for (i in rel){
        //             console.log(rel[i]);
        //             let ind = ready_list_to_table.findIndex(property => property.id == rel[i])
        //             ready_list_to_table[ind].expression = ready_list_to_table[ind].expression.replace(ready_list_to_table[index].name, name)
        //         }
        //     }
        // }
        
        propEl.nameToTable = name;
    }
    redraw_data_to_table();
    
}


function activate_ungrouping(){
    $('.ungroup__btn').click(function(){
        if (confirm("Вы точно хотите разгруппировать элементы?")){
            id_gr = $(this)[0].parentElement.parentElement.parentElement.id;
            console.log(id_gr);
            index_gr = ready_list_to_table.findIndex(property => property.id == id_gr);
            elements = ready_list_to_table[index_gr].childrens;
            elements.forEach(function(item, index, array) {
                index_prop = ready_list_to_table.findIndex(property => property.id == item.id);
                ready_list_to_table[index_prop].parent = "";
            });
            ready_list_to_table.splice(index_gr, 1);
            redraw_data_to_table();
        };
    });
}


function del_prop_out_group(){
    $('.del__prop__btn').click(function(){
        if (confirm("Вы точно хотите удалить это свойство?")){
            id_prop = $(this)[0].parentElement.parentElement.parentElement.id;
            console.log(id_prop);
            index_prop = ready_list_to_table.findIndex(property => property.id == id_prop);
            item = ready_list_to_table[index_prop];
            if (item.isContainRelation()){
                let rel = new Array();
                for (i in item.relation){
                    rel.push(ready_list_to_table[ready_list_to_table.findIndex(property => property.id == item.relation[i])].name)
                }
                alert(`Данное свойство связано со следующими параметрами: ${rel}. Удаление приведет к нарушению работы программы.`)
            }
            else{
                if (item.group){
                    index_gr = ready_list_to_table.findIndex(property => property.id == item.parent);
                    ready_list_to_table[index_gr].removeChildren(id_prop);
                }
                
                for (i in ready_list_to_table){
                    if (!ready_list_to_table[i].id.startsWith("gr")){
                        if (ready_list_to_table[i].relation.indexOf(id_prop) != -1){
                            console.log(ready_list_to_table[i]);
                            ready_list_to_table[i].removeRelation(id_prop);
                        }
                    }
                }
                
                del_prop(id_prop);
            }
        };
    });
}


function del_prop(id){
    if (id.startsWith("chbx"))
        $(`#${id}`).prop('checked', false);
    index_prop = ready_list_to_table.findIndex(property => property.id == id);
    console.log(index_prop);
    ready_list_to_table.splice(index_prop, 1);
    redraw_data_to_table();
}

function change_order(){
    $(".arrow").click(function(){
        let prop_order_id = $(this).prop("id");
        let dec = ($(this).hasClass("btn_up")) ? -1 : 1;
        index_prop = ready_list_to_table.findIndex(property => property.id == prop_order_id);
        if (!ready_list_to_table[index_prop].group){
            let  new_order_index = index_prop;
            while (new_order_index > -1 && new_order_index < ready_list_to_table.length) {
                new_order_index += dec;
                if (!ready_list_to_table[new_order_index].group){
                    let temp = ready_list_to_table[index_prop];
                    ready_list_to_table.splice(index_prop, 1);
                    ready_list_to_table.splice(new_order_index, 0, temp);
                    redraw_data_to_table();
                    break;
                }
            }
        } else{
            index_gr = ready_list_to_table.findIndex(property => property.id == ready_list_to_table[index_prop].parent);
            ind_in_group = ready_list_to_table[index_gr].childrens.findIndex(property => property.id == prop_order_id);
            console.log(ind_in_group);
            if (ind_in_group > -1 && ind_in_group < ready_list_to_table[index_gr].childrens.length){
                let temp = ready_list_to_table[index_gr].childrens[ind_in_group];
                ready_list_to_table[index_gr].childrens.splice(ind_in_group, 1);
                ready_list_to_table[index_gr].childrens.splice(ind_in_group + dec, 0, temp);
            }
            redraw_data_to_table();
        }
        console.log(index_prop);


    })
}