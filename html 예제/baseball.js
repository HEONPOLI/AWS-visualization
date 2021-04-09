let 판독기 = document.createElement('div');
let 정답 = document.createElement('div');
let 폼 = document.createElement('form');
let 입력창 = document.createElement('input');
let 제출 = document.createElement('button');

document.body.append(판독기);
document.body.append(폼);
폼.append(입력창);
폼.append(제출);
document.body.append(정답);
제출.textContent = '제출';
let 숫자배열 = [1,2,3,4,5,6,7,8,9];
let 뽑은숫자 = [];
let 스트라이크 = 0;
let 볼 = 0;
for(let i=0;i<4;i++){
    let 뽑은것 = 숫자배열.splice(Math.floor(Math.random() * 숫자배열.length),1)[0];
    뽑은숫자.push(뽑은것);
}
console.log(뽑은숫자);
정답.textContent = String(뽑은숫자);
폼.addEventListener('submit' , function (e){
    e.preventDefault();
    스트라이크 = 0;
    볼 = 0;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (뽑은숫자[i] === Number(입력창.value[j])) {
                if (i === j) {
                    스트라이크++;
                }else{
                    볼++;
                }
            }
        }
    }
    if(스트라이크 === 4){
        alert('정답입니다');
        숫자배열 = [1,2,3,4,5,6,7,8,9];
        뽑은숫자 = [];
        for(let i=0;i<4;i++){
            let 뽑은것 = 숫자배열.splice(Math.floor(Math.random() * 숫자배열.length),1)[0];
            뽑은숫자.push(뽑은것);
        }
        정답.textContent = String(뽑은숫자);
    }else{
        alert('틀렸습니다');
        판독기.textContent = 스트라이크 + '스트라이크' + 볼 + '볼';
    }
    입력창.value = '';
    입력창.focus();
})
