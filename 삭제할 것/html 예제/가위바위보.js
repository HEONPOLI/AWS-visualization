let 컴퓨터 = '0'; // 바위
let rcp = {
    바위: '0',
    가위: '-142px',
    보: '-284px'
};
function 컴퓨터의선택(컴퓨터) {
    return Object.entries(rcp).find( function (v) {
        return v[1] === 컴퓨터;
    })[0];
}
let 작동 = false;
let 인터벌 = setInterval(() => {
    작동 = true;
    if(컴퓨터 === rcp.바위){
        컴퓨터 = rcp.가위; //가위
    }else if(컴퓨터 === rcp.가위){
        컴퓨터 = rcp.보; // 보
    }else{
        컴퓨터 = rcp.바위;
    }
    document.querySelector('#computer').style.background =
        'url(https://en.pimg.jp/023/182/267/1/23182267.jpg)' + 컴퓨터 + ' 0';
} , 100);
let 클리어 = clearInterval(인터벌), 작동중 = false;
document.querySelectorAll('.btn').forEach( function (btn){
    //컴퓨터의 그림의 멈춤을 추가하여 그때 left 와 내가 클릭한것을 비교한다
    btn.addEventListener('click' , function (){
            console.log(작동);
            클리어;
            setTimeout(function (){
                if(작동 === false) {
                    인터벌 = setInterval(() => {
                        if (컴퓨터 === rcp.바위) {
                            컴퓨터 = rcp.가위; //가위
                        } else if (컴퓨터 === rcp.가위) {
                            컴퓨터 = rcp.보; // 보
                        } else {
                            컴퓨터 = rcp.바위;
                        }
                        document.querySelector('#computer').style.background =
                            'url(https://en.pimg.jp/023/182/267/1/23182267.jpg)' + 컴퓨터 + ' 0';
                    }, 100);
                    작동 = true;
                }
            }, 1000);
            let 나의선택 = this.textContent;
            console.log(나의선택, 컴퓨터의선택(컴퓨터));
    })
})