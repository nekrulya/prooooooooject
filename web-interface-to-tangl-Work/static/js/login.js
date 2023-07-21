if ($.cookie('auth_token') != undefined)
    window.location.pathname = "/main"


$('#auth').submit(function(event){
    event.preventDefault();
    let login = $('#login').val();
    let password = $('#password').val();
    $.ajax({
        type: "POST",
        url: "/api/auth",
        data: {'login': login,'password': password},
        success: function (data) {
            if (data["status"] == "success"){
                auth_token = data["content"];
                $.cookie('auth_token', auth_token, { expires: 0.08 });
                console.log(window.location.href)
                window.location.pathname = "/main"
            } else{
                alert(data["content"]);
            }
        }
    });
});