let teplate_fields = {
    "Общее количество": total_count,
    "Количество по этажам": count_to_levels,
}
let templ_id = [];
let el_lvl = new Map();

$("#add_templ_prop").click(function(){
    $("#modal_add_template_prop").css("display", "flex");
    $("#template_slct").empty();
    $("#template_slct").append(`<option disabled selected>Выберите шаблон</option>`);
    for (let key in teplate_fields) {
        $("#template_slct").append(`<option value="${key}">${key}</option>`);
    }  
});

$("#close_modal_template_btn").click(function(){
    $("#modal_add_template_prop").css("display", "none");
});

$("#templ_btn").click(function(){
    $("#modal_add_template_prop").css("display", "none");
    let templ = $("#template_slct").val(); 
    if (templ == null) {
        alert("Выберите шаблон");
    } else {
        //Подумать как переделать шаблоны
        if (templ == "Общее количество"){
            add_templ_prop(templ, teplate_fields[templ]);
        } else if (templ == "Количество по этажам"){
            get_level(templ);
        }
    }
})

async function get_level(gr_name){
    $.ajax({
        type: "POST",
        url: "/api/getLevels",
        async: false,
        headers: {
            "Authorization": auth_token,
          },
        data: {'id': $.cookie('model_id')},
        success: function (data) {
            let lvls = data.slice(1, data.length-1).replaceAll("'", "").split(', ');
            console.log(lvls);
            let gr = add_group(gr_name);
            for (l in lvls){
                let tmp_prp = add_templ_prop(lvls[l], teplate_fields[gr_name], lvls[l]);
                tmp_prp.parent = gr.id;
                gr.addChildren(tmp_prp);
            };
            redraw_data_to_table();
        }

    });
}

function add_templ_prop(name, func, sup_value="") {
    let n = 0;
    while (templ_id.includes("tmpl" + String(n))) n++;
    let id = "tmpl" + String(n);
    templ_id.push(id);
    let templ_prop = new Template(id, name, func, sup_value);
    ready_list_to_table.push(templ_prop);
    redraw_data_to_table();
    return templ_prop
}

function total_count(el_name) {
    for (let el in odata){
        if (odata[el]['Name'] == $.cookie('vor_groupName')){
            let pod_groups = odata[el]['Elements'];
            for (let i in pod_groups){
                if (pod_groups[i]["Name"] == $.cookie('vor')){
                    let position = pod_groups[i]["Elements"]
                    for (let j in position){
                        if (position[j]["Name"] == $.cookie('group')){
                            let elements = position[j]["Elements"];
                            for (let k in elements){
                                if (elements[k]["Name"] == el_name)
                                    return elements[k]["Elements"]["value"];
                            }
                        }
                    };
                }
            };
            
        };
    };


    for (el in odata){
        if (odata[el]['Name'] == $.cookie('vor_groupName')){
            let elements = odata[el]['Elements'][$.cookie('vor')]['Elements'];
            for (l in elements){
                for (k in elements[l]["Elements"]){
                    if (elements[l]["Elements"][k]["Name"] == el_name)
                        return elements[l]["Elements"][k]["Elements"]["value"];
                };
            };

        };
    };
}
async function updateLvl(){
    if ($.cookie('group') != undefined){
        group = $.cookie('group');
        for (i in tree[group]){

            let res = await $.ajax({
                type: "POST",
                url: "/api/getTreeEl",
                headers: {
                    "Authorization": auth_token,
                  },
                data: {'id': $.cookie('model_id'), 'elem': i},
                success: function (data) {
                    let lvl = data.slice(1, data.length-1).replaceAll("'", "").replaceAll(": ", ", ").split(', ');
                    console.log(data);
                    console.log(lvl);
                    let tmp_lvl = new Map();
                    for (let j = 0; j < lvl.length; j+=2){
                        tmp_lvl.set(lvl[j], lvl[j+1]);
                    }
                    el_lvl.set(i, tmp_lvl);
                }
        
            });
        }
    }
}

function count_to_levels(el_name, level){
    console.log(el_name, level);
    if (!el_lvl.has(el_name)){
        $.ajax({
            type: "POST",
            url: "/api/getTreeEl",
            async: false,
            headers: {
                "Authorization": auth_token,
              },
            data: {'id': $.cookie('model_id'), 'elem': el_name},
            success: function (data) {
                let lvl = data.slice(1, data.length-1).replaceAll("'", "").replaceAll(": ", ", ").split(', ');
                console.log(data);
                console.log(lvl);
                let tmp_lvl = new Map();
                for (let i = 0; i < lvl.length; i+=2){
                    tmp_lvl.set(lvl[i], lvl[i+1]);
                }
                el_lvl.set(el_name, tmp_lvl);
            }
    
        });
    }
    console.log(el_lvl);
    return el_lvl.get(el_name).get(level) ?? 0;
    
}




