let 테이블 = document.createElement('table');
let 칸들 = [];
let 줄들 = [];
let 턴 = 'X';
document.body.append(테이블);
for(let i=0;i<3;i++){
    let 줄 = document.createElement('tr')
    칸들.push([]);
    줄들.push(줄);
    테이블.append(줄);
    for(let j=0;j<3;j++){
        let 칸 = document.createElement('td');
        칸들[i].push(칸);
        줄.append(칸);
        칸.addEventListener('click',function (e){
            let 몇줄 = 줄들.indexOf(e.target.parentNode);
            let 몇칸 = 칸들[몇줄].indexOf(e.target);

            if(칸들[몇줄][몇칸].textContent ===  ''){
                console.log('빈칸입니다');
                칸들[몇줄][몇칸].textContent = 턴;
                let check = false
                if(칸들[몇줄][0].textContent === 턴 && 칸들[몇줄][1].textContent === 턴 && 칸들[몇줄][2].textContent === 턴){
                    check = true;
                }
                if(칸들[0][몇칸].textContent === 턴 && 칸들[1][몇칸].textContent === 턴 && 칸들[2][몇칸].textContent === 턴){
                    check = true;
                }
                if(몇줄 === 몇칸){
                    if(칸들[0][0].textContent === 턴 && 칸들[1][1].textContent === 턴 && 칸들[2][2].textContent === 턴){
                        check = true;
                    }
                    if(몇줄 === 1){
                        if(칸들[0][2].textContent === 턴 && 칸들[1][1].textContent === 턴 &&  칸들[2][0].textContent === 턴){
                            check = true;
                        }
                    }
                }
                if(Math.abs(몇줄-몇칸) === 2){
                    if(칸들[0][2].textContent === 턴 && 칸들[1][1].textContent === 턴 &&  칸들[2][0].textContent === 턴){
                        check = true;
                    }
                }
                if(check === true){
                    console.log('빙고입니다');
                    칸들.forEach(function (줄) {
                        줄.forEach(function (칸){
                            칸.textContent = '';
                        })
                    })
                    check = false;
                }
                if(턴 === 'X') 턴 = 'O';
                else 턴 = 'X';
            }else{
                console.log('빈칸이 아닙니다');
            }
        })
    }
}
console.log(칸들);
console.log(줄들);