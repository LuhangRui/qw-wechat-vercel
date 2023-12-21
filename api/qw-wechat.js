const crypto = require('crypto');
const dotenv = require('dotenv');
const xml2js = require('xml2js');
dotenv.config();

let userChatHistory = {};
let userLastChatTime = {};
let userStashMsg = {};
let userHasAnswerIng = {};
const qw_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

const emojiObj = {
  "/::)": "微笑",
  "/::~": "伤心",
  "/::B": "心动",
  "/::|": "发呆",
  "/:8-)": "得意",
  "/::<": "哭",
  "/::$": "害羞",
  "/::X": "闭嘴",
  "/::Z": "睡",
  "/::’(": "哭",
  "/::-|": "囧",
  "/::@": "发怒",
  "/::P": "调皮",
  "/::D": "笑",
  "/::O": "惊讶",
  "/::(": "难过",
  "/::+": "酷",
  "/:–b": "流汗",
  "/::Q": "抓狂",
  "/::T": "呕吐",
  "/:,@P": "偷笑",
  "/:,@-D": "幸福的笑",
  "/::d": "事不关己",
  "/:,@o": "撇嘴",
  "/::g": "饿",
  "/:|-)": "又累又困",
  "/::!": "惊恐",
  "/::L": "流汗黄豆",
  "/::>": "高兴",
  "/::,@": "悠闲",
  "/:,@f": "努力",
  "/::-S": "咒骂",
  "/:?": "疑问",
  "/:,@x": "嘘！小声点",
  "/:,@@": "晕了",
  "/::8": "我要疯了",
  "/:,@!": "太倒霉了",
  "/:!!!": "太吓人了",
  "/:xx": "打你",
  "/:bye": "拜拜",
  "/:wipe": "不带这么玩的",
  "/:dig": "不屑",
  "/:handclap": "好啊好啊",
  "/:&-(": "糗大了",
  "/:B-)": "坏笑",
  "/:<@": "不理你",
  "/:@>": "不理你",
  "/::-O": "有点累了",
  "/:>-|": "鄙视你",
  "/:P-(": "好委屈",
  "/::’|": "快哭了",
  "/:X-)": "坏笑",
  "/::*": "么么哒",
  "/:@x": "震惊",
  "/:8*": "可怜",
  "/:pd": "你太过分了",
  "/:<W>": "水果",
  "/:beer": "啤酒",
  "/:basketb": "篮球",
  "/:oo": "乒乓",
  "/:coffee": "咖啡",
  "/:eat": "美食",
  "/:pig": "可爱小猪",
  "/:rose": "送你一朵花",
  "/:fade": "难过",
  "/:showlove": "亲亲",
  "/:heart": "爱心",
  "/:break": "心裂开了",
  "/:cake": "蛋糕",
  "/:li": "闪电劈你"
};
//千问的请求逻辑
// 封装方法用于组装参数
const assembleParams = (userMessage, parameters = {}) => {
  return {
    model: process.env.API_MODEL,
    input: {
      messages: userMessage
    },
    parameters: parameters
  };
}


const keywordAutoReply = JSON.parse(process.env.KEYWORD_REPLAY);
module.exports = async function (request, response) {
  const method = request.method;
  const timestamp = request.query.timestamp;
  const nonce = request.query.nonce;
  const signature = request.query.signature;
  const echostr = request.query.echostr;

  if (method === 'GET') {
    const token = process.env.WX_TOKEN;
    const tmpArr = [token, timestamp, nonce].sort();
    const tmpStr = tmpArr.join('');
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex');
    if (hash === signature) {
      response.status(200).send(echostr);
      return;
    } else {
      response.status(200).send("failed");
      return;
    }
  }

  const xml = request.read().toString();
  const parser = new xml2js.Parser();
  const textMsg = await parser.parseStringPromise(xml);
  // console.log(textMsg);
  const ToUserName = textMsg.xml.ToUserName[0];
  const FromUserName = textMsg.xml.FromUserName[0];
  // const CreateTime = textMsg.xml.CreateTime[0];
  const MsgType = textMsg.xml.MsgType[0];
  console.log("收到消息类型：" + MsgType);
  let Content;
  const timeNow = Math.floor(Date.now() / 1000);
  if (MsgType === 'text') {
    Content = textMsg.xml.Content[0];
    console.log("收到文本消息：" + Content)
    if (Object.hasOwnProperty.call(emojiObj, Content)) {
      //用户发送了微信自带表情
      Content = '我发送了表情：' + emojiObj[Content] + '，现在你要怎么做'
    }
    console.log("关键词配置：", keywordAutoReply, "文本内容：" + Content, "匹配结果：", Object.hasOwnProperty.call(keywordAutoReply, Content));
    if (Object.hasOwnProperty.call(keywordAutoReply, Content)) {
      //关键词自动回复
      console.log("触发关键词自动回复");
      response.status(200).send(formatReply(
        FromUserName,
        ToUserName,
        timeNow,
        keywordAutoReply[Content]
      ));
      return;

    }
  }


  if (MsgType === 'event') {
    const Event = textMsg.xml.Event[0];
    if (Event === 'subscribe') {
      response.status(200).send(formatReply(
        FromUserName,
        ToUserName,
        timeNow,
        process.env.SUBSCRIBE_REPLY
      ));
      return;
    } else {
      return response.status(200).send('');
    }
  }

  if (userHasAnswerIng[FromUserName]) {
    response.status(200).send(formatReply(
      FromUserName,
      ToUserName,
      timeNow,
      '微信规定要在5s内回复，但是本次需要回复的内容很长，现在还没整理好，所以你暂时看到了这条消息。请稍后回复任意文字尝试获取回复。比如数字 1。'
    ));
    return;
  }
  if (userStashMsg[FromUserName]) {
    console.log('用户有暂存数据，返回暂存数据');
    let tmp = userStashMsg[FromUserName];
    userStashMsg[FromUserName] = '';
    response.status(200).send(formatReply(
      FromUserName,
      ToUserName,
      timeNow,
      tmp
    ));
    return;
  }
  console.log("当前时间：", timeNow, "上次时间：", userLastChatTime[FromUserName])
  if (
    userLastChatTime[FromUserName] &&
    timeNow - userLastChatTime[FromUserName] >= 300
  ) {
    userChatHistory[FromUserName] = [];
  }
  userLastChatTime[FromUserName] = timeNow;
  if (!userChatHistory[FromUserName]) {
    userChatHistory[FromUserName] = [];
  }
  userChatHistory[FromUserName].push({ role: 'user', content: Content });
  console.log("会话历史：", userChatHistory);


  let isResolved = false;
  let answer = '';
  let timeout;

  function createSSEClient(body) {
    const headers = {
      'Authorization': 'Bearer ' + process.env.API_KEY,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable'
    };
    const fetchPromise = fetch(qw_url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(response => {
      const reader = response.body.getReader();
      let decoder = new TextDecoder();
      let data = '';

      return new Promise((resolve, reject) => {
        function processResult(result) {
          if (result.done) {
            return;
          }
          data += decoder.decode(result.value, { stream: true });

          let index;
          while ((index = data.indexOf('\n')) >= 0) {
            let line = data.slice(0, index);
            data = data.slice(index + 1);
            // Only parse lines that start with 'data:'
            if (line.startsWith('data:')) {
              let message = line.slice(5); // Remove 'data:' prefix

              // Parse the event data and handle it
              const event = JSON.parse(message);
              const output = event.output;
              const text = output.text;

              answer = text;

              if (output.finish_reason == 'stop') {
                console.log('收到最终结果：', answer);
                clearTimeout(timeout);
                userHasAnswerIng[FromUserName] = false;
                userChatHistory[FromUserName].push({
                  role: 'assistant',
                  content: answer,
                });
                if (!isResolved) {
                  //未超4s
                  resolve(answer);
                } else {
                  //已超时，暂存结果等待取用
                  userStashMsg[FromUserName] = answer;
                }
              }
            }
          }
          reader.read().then(processResult).catch(reject);
        }

        reader.read().then(processResult).catch(reject);

      });

    });

    const timeoutPromise = new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        isResolved = true;
        userHasAnswerIng[FromUserName] = true;
        console.log('执行超过4s，提前返回');
        answer = '微信规定要在5s内回复，但是我正在思考中，所以你暂时看到了这条消息。请稍后回复任意文字尝试获取回复。比如数字 1。'
        resolve(answer);
      }, 4000);
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  let params = assembleParams(userChatHistory[FromUserName],{});
  // console.log(params)
  createSSEClient(params)
    .then(res => {
      response.status(200).send(formatReply(FromUserName, ToUserName, timeNow, res));
    })
    .catch(error => {
      console.error(error)
      response.status(200).send("")
    });

};

function formatReply(ToUserName, FromUserName, CreateTime, Content) {
  return `<xml>
        <ToUserName><![CDATA[${ToUserName}]]></ToUserName>
        <FromUserName><![CDATA[${FromUserName}]]></FromUserName>
        <CreateTime>${CreateTime}</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[${Content}]]></Content>
    </xml>`;
}

