let img = document.querySelector('.view_icon');
let modalForm = document.querySelector('.modal_form');
let imgIsVisible = true;
img.addEventListener('click', function(e){
    if (imgIsVisible) {
        imgIsVisible = false;
        img.setAttribute('src', 'static/img/hide.png');
        modalForm.classList.add('hidden');
    } else {
        imgIsVisible = true;
        img.setAttribute('src', 'static/img/view.png');
        modalForm.classList.remove('hidden');
    }
})

function modal_flip_flop(){
    let abc = document.querySelectorAll('.open_list');
    for (el of abc) {
        el.addEventListener('click', function(event){
            try {
                let ul = this.parentElement.querySelector('ul');
                for (li of ul.children) {
                    li.classList.toggle('hidden');
                }
            }
            catch (err) {
                console.log(this)
                let ul = this.closest('li').querySelector('ul');
                ul.classList.toggle('hidden')
            }
        })
    }
}