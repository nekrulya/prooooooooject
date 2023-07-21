let param_id = [];

$("#add_param_prop").click(function(){
    $("#modal_add_param_prop").css("display", "flex");
});
 
$('#add_param_prop_form').submit(function(event){
    event.preventDefault();
    let prop__name = $("#prop_name").val().trim();
    let expr = $('#expression').val().trim();
    let n = 0;
    while (param_id.includes("param" + String(n))) n++;
    let id = "param" + String(n);
    param_id.push(id);
    for (el in ready_list_to_table){
        if (expr.includes(ready_list_to_table[el].name.replaceAll(" ", "_"))){
            ready_list_to_table[el].addRelation(id);
        };
    }
    let prop = new Param(id, prop__name, expression=expr)
    ready_list_to_table.push(prop);
    redraw_data_to_table();
     
});
 
$("#search_prop").click(function(event){
    event.preventDefault();
    $("#modal_search_prop").css("display", "flex");
    view_available_prop();
});
 
function view_available_prop(){
    $("#field").empty();
    $("#field").append("<option disabled selected>Выберите поле</option>");
    for (el in ready_list_to_table){
        $("#field").append(`<option value='${ready_list_to_table[el].id}'>${ready_list_to_table[el].nameToTable} (${ready_list_to_table[el].name})</option>`);
    }
}
 
$("#modal_btn").click(function(event){
    event.preventDefault();
    let val = $("#field").val();
    if (val != null){
        let el = ready_list_to_table[ready_list_to_table.findIndex(property => property['id'] == val)];
        let var_name = el.name.replaceAll(" ", "_");
        $('#expression').val($('#expression').val() + " " + var_name);
        $("#modal_search_prop").css("display", "none");
    }
    
});

$("#close_modal_btn").click(function(){
    $("#modal_add_param_prop").css("display", "none");
    $("#modal_search_prop").css("display", "none");
});

$("#close_search_modal_btn").click(function(){
    $("#modal_search_prop").css("display", "none");
});