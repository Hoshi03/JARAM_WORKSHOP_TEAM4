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

var client_id = 'EnXfgrtCVZ7y4g3KCb3T';
var client_secret = 'cVhf5Y3Ny0';

app.get('/translate', function (req, res) {
   var api_url = 'https://openapi.naver.com/v1/papago/n2mt';
   var query = req.query.q;
   
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

 // '/ingredients' 엔드포인트를 통해 입력한 재료 배열 반환
app.get('/ingredients', function (req, res) {
  res.status(200).json(ingredients);
});


 app.listen(3000, function () {
   console.log('http://localhost:3000/ app listening on port 3000!');
 });