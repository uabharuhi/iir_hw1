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


class ArticleFactory{
  constructor(){

  }

  createArticle(filepath,filename){
    if(path.extname(filename)==".xml"){
      return this.createPubmedArticle(filepath,filename);
    }
    else if(path.extname(filename)==".json"){
       return this.createTwitterArticle(filepath,filename);
    }
  }

  createPubmedArticle(filepath,filename){
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
              const title = jp.query(result,'$..ArticleTitle');
              if(abstracts.length==0){
                  window.alert( `no abstract in ${filepath}`);
                  return;
              }
              let info = new PubmedArticle(filepath,title[0][0],data,result,abstracts);
              index.article_infos.push(info);
              insert_cnt_table_row(info);

          });
      });
  }

  createTwitterArticle(filepath,filename){
    fs.readFile(filepath, 'utf8', function(err, data) {
      try
      {
         let  text =data;
         var json = JSON.parse(text);
      }
      catch(e)
      {
           window.alert( `Can not parse  : ${filepath}`);
           return;
      }
      let info = new TwitterArticle(filepath,json);
      index.article_infos.push(info);
      insert_cnt_table_row(info);
    });
  }

}

class  TwitterArticle{
    constructor(filepath,json_obj) {
        this.filepath = filepath;
        this.json_obj = json_obj;
        this.content_list =[];

        this.create_content_list();


        this.character_cnt = this.getCharacterCount();
        this.word_cnt = this.getArticleWordCount();
        this.setenceCount = this.getArticleSentenceCount();
    }

  create_content_list(){
    for(let i=0;i<this.json_obj.length;++i){
      this.content_list.push(this.json_obj[i]["text"]);
    }
  }

  getFileName(){
    return path.basename(this.filepath);
  }

  query(re){
      let  res = [];
      let m =null;
      for(let i=0;i<this.content_list.length;++i){
          while(m=re.exec(this.content_list[i])){
              res.push(m[0]);
          }
      }
      return res;
    }

    getCharacterCount(){
      let character_cnt = 0;
      for(let i=0;i<this.content_list.length;++i){
          character_cnt+=this.content_list[i].length;
      }
      return character_cnt;
    }

    getArticleWordCount(){
      let word_cnt =0;
      for(let i=0;i<this.content_list.length;++i){
           word_cnt+=this.getWordCount(this.content_list[i]);
      }
      return word_cnt;
    }
    getArticleSentenceCount(){
      let sen_cnt =0;
      for(let i=0;i<this.content_list.length;++i){
          sen_cnt+= this.getSetenceCount(this.content_list[i]);
      }
      return sen_cnt;
    }
    //都勉強可以
    getWordCount(text){
      return this.getLengthOfMatch(text.match(/[a-zA-Z_0-9]+/g));
    }


    getSetenceCount(text){
      //http 超多的...
      let http_reg = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g;
      text = text.replace(http_reg, "");


      //twitter 不一定有句號...
      let num = 1+this.getLengthOfMatch(text.match(/\./g))
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

class  PubmedArticle{
    constructor(filepath,title,fulltext,json_obj,abstract_arr) {
        this.filepath = filepath;
        this.fulltext = fulltext;
        this.json_obj = json_obj;
        this.abstract_arr = abstract_arr;
        this.title = title;
        this.content_list =[];

        this.create_content_list();


        this.character_cnt = this.getCharacterCount();
        this.word_cnt = this.getArticleWordCount();
        this.setenceCount = this.getArticleSentenceCount();
    }

  create_content_list(){
    this.content_list.push(this.title);
    for(let i=0;i<this.abstract_arr.length;++i){
        for(let j =0;j<this.abstract_arr[i].length;++j){ //beacause xml library think there may be other node <abstract text>
          this.content_list.push(this.abstract_arr[i][j]);
        }
     }
  }

	getFileName(){
		return path.basename(this.filepath);
	}

  query(re){
      let  res = [];
      let m =null;
      for(let i=0;i<this.content_list.length;++i){
          while(m=re.exec(this.content_list[i])){
              res.push(m[0]);
          }
      }
      return res;
    }

    getCharacterCount(){
      let character_cnt = 0;
      for(let i=0;i<this.content_list.length;++i){
          character_cnt+=this.content_list[i].length;
      }
      return character_cnt;
    }

    getArticleWordCount(){
      let word_cnt =0;
      for(let i=0;i<this.content_list.length;++i){
           word_cnt+=this.getWordCount(this.content_list[i]);
      }
      return word_cnt;
    }
    getArticleSentenceCount(){
      let sen_cnt =0;
      for(let i=0;i<this.content_list.length;++i){
          sen_cnt+= this.getSetenceCount(this.content_list[i]);
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

function showQueryResults(article,res,keyword){
  if(res.length==0){
    return;
  }
  var div = document.getElementById('query_result');
  const filepath =  article.filepath;
  //var ul = $(`<ul class="collection with-header"><li class="collection-header"><h5>${filepath}</h5></li></ul>`);
  var ul = $(`<ul class=""><li class="collection-header">${res.length} matchs in <span class="bigtext">${filepath}</span></li></ul>`);
 
  for(let i=0;i<res.length;++i){
    let _text = res[i];
    //to hightlight
    let reg = new RegExp(keyword,"gi");
    let parts = _text.split(reg);
    let  matches = [];
    while (found = reg.exec(_text)) {
      matches.push(found[0]);
    }
    let text = "";
    for(let i=0;i<parts.length-1;++i){
      text+=parts[i]+`<span style="color:red;">${ matches[i]}</span>`;
    }
    text+=parts[parts.length-1];
    let li = $(`<li class="more_space">${text}</li>`);
    ul.append(li);
  }
  
  $(div).append(ul);
  $(div).append($(`<div class="divider"></div>`));
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
            showQueryResults(index.article_infos[i],res,value);

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
        let factory = new ArticleFactory();
        files.forEach(filename => {
          const filepath = path.join(corpus_folder,filename);
          factory.createArticle(filepath,filename);
        });
      });
     
});
