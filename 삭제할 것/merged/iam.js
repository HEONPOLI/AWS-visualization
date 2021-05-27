const container = document.querySelector('.container');
function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

//usage:
readTextFile("./json/iaminfo2.json", function(text){
    var data = JSON.parse(text);
    for(var i in data){
        var clone = document.querySelector('.clone_item');
        var item = clone.cloneNode(true);
        item.className = 'item';
        var cperm = document.querySelector('.clone_p');
        var perm = cperm.cloneNode(true);
        perm.className = 'permission';
        var str = data[i].Arn;
        var idx = str.indexOf('/');

        console.log(str , 'check');
        perm.querySelector('.userArn').textContent = str.substr(idx+1);
        console.log(perm);
        item.querySelector('.userName').textContent = data[i].UserName;
        item.appendChild(perm);
        container.appendChild(item);

        // var div = document.createElement('div');
        // var list = document.createElement('ul');
        // var iamName = document.createElement('li');
        // iamName.textContent = data[i].UserName;
        // var iamId = document.createElement('li');
        // iamId.className = data[i].Userid;
        // var iamArn = document.createElement('li');
        // iamArn.className = data[i].Arn;
        // var iamDate = document.createElement('li');
        // iamDate.className = data[i].CreateDate;
        // // if(i !== 0) {
        // //     var iamGroupName = document.createElement('div');
        // //     iamGroupName.textContent = data[i].GroupInfo.GroupId;
        // //     list.appendChild(iamGroupName);
        // // }
        // div.className = 'item';
        //
        //
        // list.appendChild(iamName);
        // list.appendChild(iamId);
        // list.appendChild(iamArn);
        // list.appendChild(iamDate);
        // div.appendChild(list);
        // container.appendChild(div);
        // console.log(data[i].UserName);
    }
});