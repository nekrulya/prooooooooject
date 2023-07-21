

async function create_table(){
    if (tree != undefined && group != undefined){
        await new Promise(function(resolve, reject){
            $("#preloader_malc").css("display", "block");
            setTimeout(() => {
                resolve(null)
            }, 50);
        });
        $("#finally_table").empty();
    
        let html = "<table id='ready_table' class='final_table' border='1'>"
        let d = {}
        let no_group = []
        for (let el of ready_list_to_table){
            if (el.id.startsWith("gr")){
                d[el.id] = []
            }
        }
        for (let el of ready_list_to_table){
            if ((el.id.startsWith("chbx") || el.id.startsWith("param") || el.id.startsWith("tmpl"))  && el.group){
                d[el.parent].push(el)
            } else {
                no_group.push(el)
            }
        }
        let thead = "<thead>"
        let tr1 = "<tr>"
        let tr2 = "<tr>"
    
        for (let el of no_group) {
            if (d[el.id]){
                tr1 += `<th colspan="${d[el.id].length}">${el.nameToTable}</th>`
                for (el of d[el.id]) {
                    tr2 += `<th>${el.nameToTable}</th>`
                }
            } else {
                tr1 += `<th rowspan="2">${el.nameToTable}</th>`
            }
        }


        tr1 += "</tr>"
        tr2 += "</tr>"
        thead += tr1 + tr2 + "</thead>"
        html += thead + "<tbody>"
        group = $.cookie('group');
        for (i in tree[group]){
            html += "<tr>"
            for (index in ready_list_to_table){
                let item = ready_list_to_table[index];
                if (item.id.startsWith("gr")){
                    for (el in item.childrens){
                        prop = item.getChildren(el)
                        if (prop.id.startsWith("chbx"))
                            html += `<td>${getValue(prop.path, i)}</td>`;
                        else if (prop.id.startsWith("param"))
                            html += `<td>${getParamValue(prop, i)}</td>`;
                        else if (prop.id.startsWith("tmpl"))
                            html += `<td>${prop.func(i, prop.sup_val)}</td>`;
                    }
                }
                else if (item.id.startsWith("chbx") && !item.group){
                    html += `<td>${getValue(item.path, i)}</td>`;
                }
                else if (item.id.startsWith("param") && !item.group){
                    html += `<td>${getParamValue(item, i)}</td>`;
                }
                else if (item.id.startsWith("tmpl") && !item.group){
                    html += `<td>${item.func(i, item.sup_val)}</td>`;
                }
                
            }
            
            
            html += "</tr>"
            
        }
        html += "</tbody></table>"
        html += "<button id='dowload_btn' class='download_btn'>Скачать эксель</button>"
        $("#finally_table").append(html);
        $("#preloader_malc").css("display", "none");
        download();
        
    }
}

$(".create_table_btn").click(function(event){
    event.preventDefault();
    create_table();
} );


function getValue(path, el_name){
    let value = tree[group][el_name][path[0]];
    for (let j = 1; j < path.length; j++){
        value = value[path[j]]    
    }
    return value
}


function getParamValue(obj, el_name){
    let vars = ""; 
    let val;
    for (let i in ready_list_to_table){
        if (!ready_list_to_table[i].id.startsWith("gr")){
            console.log(ready_list_to_table[i].id)
            if (ready_list_to_table[i].relation.findIndex(property => property == obj.id) != -1){
                if (ready_list_to_table[i].id.startsWith("chbx")) {
                    vars += `${ready_list_to_table[i].name}:${getValue(ready_list_to_table[i].path, el_name)};`;
                }
                else if (ready_list_to_table[i].id.startsWith("param")){
                    vars += `${ready_list_to_table[i].name}:${getParamValue(ready_list_to_table[i], el_name)};`;
                }
                else if (ready_list_to_table[i].id.startsWith("tmpl")){
                    vars += `${ready_list_to_table[i].name.replaceAll(" ", "_")}:${ready_list_to_table[i].func(el_name, ready_list_to_table[i].sup_val)};`;
                    console.log("TEST")
                }

            }
        }
    }
    console.log(vars);
    $.ajax({
            type: "POST",
            url: "/api/convertToExpression",
            async: false,
            data: {'expression': obj.expression, 'dict': String(vars)},
            success: function (data) {
                val = data;
            },
            error: function(){
                alert("Проверьте правильность формулы!");
            }
    
    });
    console.log(val);
    return val;
}


function download(){
    $("#dowload_btn").click(function(){
        let downloadLink;
        let dataType = 'application/vnd.ms-excel';
        let tableID = 'ready_table'
        let tableSelect = document.getElementById(tableID);
        let tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

        
        // Specify file name 
        filename = prompt("Введите название файла для сохранения", "ВОР") + '.xls';
        
        // Create download link element
        downloadLink = document.createElement("a");
        
        document.body.appendChild(downloadLink);
        
        if(navigator.msSaveOrOpenBlob){
            let blob = new Blob(['\ufeff', tableHTML], {
                type: dataType
            });
            navigator.msSaveOrOpenBlob( blob, filename);
        }else{
            // Create a link to the file
            downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
        
            // Setting the file name
            downloadLink.download = filename;
            
            //triggering the function
            downloadLink.click();
        }
    });
}