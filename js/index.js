//const ipc = require('electron').ipcRenderer
const fileReaderBtn = document.getElementById('readfile');
const  fs = require('fs');
const  corpus_folder = './corpus';
const path = require("path");
const parseString = require('xml2js').parseString;
const jp = require('jsonpath');

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

fileReaderBtn.addEventListener('click', function () {
	//document.getElementById('file-input').click();

      //document.getElementById('selected-file').innerHTML = `You selected: ${path}`
      if (! fs.existsSync(corpus_folder )) {
            window.alert('corpus doesnt exist!');
      }
			let article_infos = [] ;
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
                    article_infos.push(info);
                    insert_cnt_table_row(info);

                });
            });
        });


        //sessionStorage.setItem("Articles", article_infos);

      });
      document.getElementById("count_result").style.display="block";

});
