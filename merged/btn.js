const btn_right = document.querySelector('.button--sidebar');
const side_right = document.querySelector('.side-right');
btn_right.addEventListener('click',function (){
    side_right.classList.toggle('active')
})