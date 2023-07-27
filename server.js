var express = require('express');
var app = express();
var dotenv = require('dotenv');
dotenv.config();
var request = require('request');
var { OpenAIApi, Configuration } = require('openai');
app.use(express.static('public'));

// app.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY) ;

// console.log(process.env.OPENAI_API_KEY);

const api_key = process.env.OPENAI_API_KEY;

console.log(api_key);

let config = new Configuration({
  apiKey: `${api_key}`,
});
let openai = new OpenAIApi(config);


app.get('/', function(req,res){
  res.sendFile(__dirname + '/index.html')
})

let ingredients = [];

var client_id = '5v7pE3U7G_m0Eiovkp5b';
var client_secret = '2u3g2o6Ppw';

////////////////////////SQLite 데이터베이스를 생성하고 words 테이블생성
const sqlite3 = require('sqlite3').verbose();
// 데이터베이스 생성 및 연결
const db = new sqlite3.Database('my_database.db');

// words 테이블 생성
db.run(`CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL
)`);
////////////////////////////

app.get('/translate', function (req, res) {
   var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
   var query = req.query.q;

///////////////// 입력받은 단어를 데이터베이스에 저장
    db.run(`INSERT INTO words (word) VALUES (?)`, [query], function (err) {
      if (err) {
        return console.log('데이터베이스 저장 오류:', err.message);
      }
      console.log('단어가 성공적으로 저장되었습니다.');
    });
/////////////////
   
   var options = {
       url: api_url,
       form: {'source':'ko', 'target':'en', 'text':query},
       headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
    };
   request.post(options, function (error, response, body) {
       var 영어 = JSON.parse(body).message?.result.translatedText;

       openai.createCompletion({
          model: "text-davinci-002",
          prompt: 영어,
          temperature: 0.7,
          max_tokens: 128,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }).then((result) => {
          console.log('ai 응답', result.data.choices[0].text);

          var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
          var query = result.data.choices[0].text;
          var options = {
              url: api_url,
              form: {'source':'en', 'target':'ko', 'text':query},
              headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
          };
          request.post(options, function (error, response, body) {
            console.log(body);
            res.status(200).json(body);
              
          });


        }).catch((error)=>{
          console.log('openai error', error)
        })

   });
 });

 ////////////////// 예시: '/words' 엔드포인트에서 모든 단어를 불러오는 코드
 app.get('/words', function (req, res) {
  db.all(`SELECT * FROM words`, function (err, rows) {
    if (err) {
      return console.log('데이터베이스 조회 오류:', err.message);
    }
    res.status(200).json(rows);
  });
});
//////////////////// Endpoint to delete a word by ID
app.delete('/words/:id', function (req, res) {
  const wordId = req.params.id;

  db.run('DELETE FROM words WHERE id = ?', [wordId], function (err) {
    if (err) {
      return console.log('데이터베이스 삭제 오류:', err.message);
    }
    console.log('단어가 성공적으로 삭제되었습니다.');
    res.sendStatus(200);
  });
});
///////////////////

 // '/ingredients' 엔드포인트를 통해 입력한 재료 배열 반환
app.get('/ingredients', function (req, res) {
  res.status(200).json(ingredients);
});

 app.listen(3000, function () {
   console.log('http://localhost:3000/ app listening on port 3000!');
 });