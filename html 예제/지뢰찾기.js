let tbody = document.querySelector('#table tbody');
let dataset = [];
document.querySelector('#exec').addEventListener('click',function () {
    let hor = parseInt(document.querySelector('#hor').value);
    let ver =  parseInt(document.querySelector('#ver').value);
    let mine = parseInt(document.querySelector('#mine').value);
    let arr = Array(hor*ver).fill().map(function (e,i){ return i});
    let suf = [];
    while(suf.length < mine){
        let select = arr.splice(Math.floor(Math.random()*arr.length),1);
        suf.push(select);
    }
    for(let i=0;i<hor;i++){
        let col = [];
        let tr = document.createElement('tr');
        dataset.push(col);
        for(let j=0;j<ver;j++){
            col.push(1);
            let td = document.createElement('td');
            td.addEventListener('contextmenu' , function (e){
                e.preventDefault();
                let 부모tbody = e.currentTarget.parentNode.parentNode;
                let 부모tr = e.currentTarget.parentNode;
                let 줄 = Array.prototype.indexOf.call(부모tbody.children,부모tr);
                let 칸 = Array.prototype.indexOf.call(부모tr.children,e.currentTarget);
                if(e.currentTarget.textContent === '' || e.currentTarget.textContent === 'X'){
                    e.currentTarget.textContent = '!';
                }else if(e.currentTarget.textContent === '!'){
                    e.currentTarget.textContent = '?';
                }else if(e.currentTarget.textContent === '?'){
                    if(dataset[줄][칸] === 'X'){
                        e.currentTarget.textContent = 'X';
                    }else{
                        e.currentTarget.textContent = '';
                    }
                }
                console.log(dataset);
            })
            td.addEventListener('click' , function (e){
                e.preventDefault();
                let 부모tbody = e.currentTarget.parentNode.parentNode;
                let 부모tr = e.currentTarget.parentNode;
                let 줄 = Array.prototype.indexOf.call(부모tbody.children,부모tr);
                let 칸 = Array.prototype.indexOf.call(부모tr.children,e.currentTarget);

                if(dataset[줄][칸] === 'X'){
                    e.currentTarget.textContent = '펑';
                }else{
                    let 주변 = [ dataset[줄][칸-1] , dataset[줄][칸+1]];
                    if(dataset[줄-1]){
                        주변 = [dataset[줄-1][칸-1] , dataset[줄-1][칸] , dataset[줄-1][칸+1]].concat(주변);
                    }
                    if(dataset[줄+1]){
                        주변 = 주변.concat([dataset[줄+1][칸-1] , dataset[줄+1][칸] , dataset[줄+1][칸+1]]);
                    }

                    e.currentTarget.textContent = 주변.filter(function (v){return v === 'X'}).length;
                }

            })
            tr.append(td);
        }
        tbody.append(tr);
    }
    for(i=0;i<suf.length;i++){
        let x = Math.floor(suf[i]/ver);
        let y = Math.floor(suf[i]%ver);
        tbody.children[x].children[y].textContent = 'X';
        dataset[x][y] = 'X';
    }
    console.log(dataset);
})
tbody.querySelectorAll('td').forEach(function (td){
    td.addEventListener('contextmenu' , function (){
        console.log('오른쪽클릭');
    })
})