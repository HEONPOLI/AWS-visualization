let lotto_btn = document.getElementById('btn');
let 결과창 = document.getElementById('결과창');

lotto_btn.addEventListener( 'click' ,function () {
    let 로또번호 = Array(45).fill().map(function (e , i) {return i+1});
    let 추첨번호 = [];
    while(추첨번호.length < 5) {
        let 뽑힌번호 = 로또번호.splice(Math.floor(Math.random() * 로또번호.length), 1);
        추첨번호.push(뽑힌번호);
    }
    function 공배치(idx){
        let 뽑힌공 = document.createElement('div');
        뽑힌공.textContent = 추첨번호[idx];
        뽑힌공.style.display = 'flex'
        뽑힌공.style.border = '1px solid black';
        뽑힌공.style.borderRadius = '100px';
        뽑힌공.style.width = '50px';
        뽑힌공.style.height = '50px';
        if(추첨번호[idx] <10) 뽑힌공.style.background = '#000';
        else if(추첨번호[idx] <20) 뽑힌공.style.background = 'gray';
        else if(추첨번호[idx] <30) 뽑힌공.style.background = 'yellow';
        else if(추첨번호[idx] <40) 뽑힌공.style.background = 'red';
        else 뽑힌공.style.background = 'pink';
        뽑힌공.style.color = '#fff';
        뽑힌공.style.alignItems = 'center';
        뽑힌공.style.justifyContent = 'center';
        뽑힌공.style.marginRight = '10px';
        결과창.append(뽑힌공);
    }
    추첨번호.sort( function (a,b) {return a-b;});
    setTimeout(공배치,1000,0);
    setTimeout(공배치,2000,1);
    setTimeout(공배치,3000,2);
    setTimeout(공배치,4000,3);
    setTimeout(공배치,5000,4);
    // for(let i=0;i<추첨번호.length;i++){
    //     let 뽑힌공 = document.createElement('div');
    //     뽑힌공.className = '공들';
    //     결과창.append(뽑힌공);
    //     뽑힌공.textContent = 추첨번호[i];
    // }
})
