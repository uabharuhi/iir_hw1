//const ipc = require('electron').ipcRenderer
const fileReaderBtn = document.getElementById('corpus');
const search = document.getElementById('search');
const query_bar = document.getElementById('query_bar');

const  fs = require('fs');
const  corpus_folder = './corpus';
const path = require("path");
const parseString = require('xml2js').parseString;
const jp = require('jsonpath');
var index ={};


class  PubmedArticle{
    constructor(filepath,fulltext,json_obj,abstract_arr) {
        this.filepath = filepath;
        this.fulltext = fulltext;
        this.json_obj = json_obj;
        this.abstract_arr = abstract_arr;

        this.character_cnt = this.getCharacterCount();
        this.word_cnt = this.getArticleWordCount();
        this.setenceCount = this.getArticleSentenceCount();
    }

	getFileName(){
		return path.basename(this.filepath);
	}

  query(re){
      let  res = [];
      for(let i=0;i<this.abstract_arr.length;++i){
        for(let j =0;j<this.abstract_arr[i].length;++j){ //beacause xml library think there may be other node <abstract text>
            let m =0;
            while(m=re.exec(this.abstract_arr[i][j])){
              res.push(m[0]);
            }

        }
      }

      return res;
    }

    getCharacterCount(){
      let character_cnt = 0;
      for(let i=0;i<this.abstract_arr.length;++i){
        for(let j =0;j<this.abstract_arr[i].length;++j){
            character_cnt+= this.abstract_arr[i][j].length;
        }
      }
      return character_cnt;
    }

    getArticleWordCount(){
      let word_cnt =0;
      for(let i=0;i<this.abstract_arr.length;++i){
        for(let j =0;j<this.abstract_arr[i].length;++j){ //beacause xml library think there may be other node <abstract text>
            word_cnt += this.getWordCount(this.abstract_arr[i][j])
        }
      }
      return word_cnt;
    }
    getArticleSentenceCount(){
      let sen_cnt =0;
      for(let i=0;i<this.abstract_arr.length;++i){
        for(let j =0;j<this.abstract_arr[i].length;++j){
            sen_cnt += this.getSetenceCount(this.abstract_arr[i][j])
        }
      }
      return sen_cnt;
    }
    //都勉強可以
    getWordCount(text){
      return this.getLengthOfMatch(text.match(/[a-zA-Z_0-9]+/g));
    }


    getSetenceCount(text){
      let num = this.getLengthOfMatch(text.match(/\./g))
                -2* this.getLengthOfMatch(text.match(/[\.]{3}/g))
                + this.getLengthOfMatch(text.match(/[!]+/g))
                + this.getLengthOfMatch(text.match(/[\?]+/g))
                - this.getLengthOfMatch(text.match(/[^a-z^A-Z^-^0-9]+[a-zA-Z-0-9]{1,5}[\.][a-zA-Z-0-9]{1,5}[^a-z^A-Z^-^0-9]+/g));
                //if sequence is  name by name
                // there will be a bug?
      return num ;
    }

    getLengthOfMatch(match){
      if(match==null){
        return 0;
      }
      return match.length;

    }





}

function insert_cnt_table_row(article,i){
	 var table = document.getElementById("count_table");
	 var row =  table.insertRow(table.rows.length);
	 var cols =  [article.getArticleSentenceCount(),article.getArticleWordCount(),article.getCharacterCount(),article.getFileName()];
      cols.forEach(function(col) {
        let cell = row.insertCell(0);
        cell.innerHTML = col;
      });
}

function clear_screen(){
  var xs = document.getElementsByClassName("_show");
  for(let i=0;i<xs.length;++i){
    xs[i].classList.remove("_show");
  }
}
/*
      <ul class="collection with-header">
        <li class="collection-header"><h4>First Names</h4></li>
        <li class="collection-item"></li>
        <li class="collection-item"></li>
        <li class="collection-item"></li>
        <li class="collection-item"></li>
      </ul>
      */
function showQueryResults(article,res){
  var div = document.getElementById('query_result');
  const filepath =  article.filepath;
  //var ul = $(`<ul class="collection with-header"><li class="collection-header"><h5>${filepath}</h5></li></ul>`);
  var ul = $(`<ul class=""><li class="collection-header"><h5>${filepath}</h5></li></ul>`);
 
  for(let i=0;i<res.length;++i){
    let text = res[i];
    let li = $(`<li>${text}</li>`);
    ul.append(li);
  }
  
  $(div).append(ul);
  /*
  for(let i =0;i<res.length;++i){
      $(div),;
  }
  */
}

index.article_infos = [] ;

 query_bar.onkeypress = function(e){
    var keyCode = e.keyCode || e.which;
    if(!this.value.length){
        return ;    
    }
    if (keyCode == '13'){
        document.getElementById('query_result').innerHTML="";
        const value = this.value;
        for(let i=0;i<index.article_infos.length;++i){
            res = index.article_infos[i].query(new RegExp(`.{0,10}${value}.{0,10}`,'gi'));
            showQueryResults(index.article_infos[i],res);

        }
    }
  };
  
  
  


search.addEventListener('click', function () {
    clear_screen();
    
    if(index.article_infos.length==0){
      window.alert("No datas, please load corpus first");
     
    }
    
    let div = document.getElementById("search_page");
    div.classList.add("_show");
  }
);


fileReaderBtn.addEventListener('click', function () {
	//document.getElementById('file-input').click();     
      //document.getElementById('selected-file').innerHTML = `You selected: ${path}`
      if (! fs.existsSync(corpus_folder )) {
            window.alert('corpus doesnt exist!');
      }
      clear_screen()
      let div = document.getElementById("count_result");
      div.classList.add("_show");
      let table = document.getElementById("count_table");
      table.innerHTML="";
      //這裡應該要改成同步讀取
      fs.readdir(corpus_folder , (err, files) => {
        files.forEach(filename => {

          const filepath = path.join(corpus_folder,filename);

          fs.readFile(filepath, 'utf8', function(err, data) {
                //var json = xml_parser.toJson(data);
                const xml = data;
                parseString(xml, function (err, result) {
                    //inspect(result);
                    if(result === undefined){
                        window.alert( `Can not parse  : ${filepath}`);
                        return;
                    }
                    const abstracts = jp.query(result, '$..AbstractText');

                    if(abstracts.length==0){
                        window.alert( `no abstract in ${filepath}`);
                        return;
                    }
                    info = new PubmedArticle(filepath,data,result,abstracts);
                    //console.log(info);
                    index.article_infos.push(info);
                    insert_cnt_table_row(info);

                });
            });
        });


        //sessionStorage.setItem("Articles", article_infos);

      });
     
});
