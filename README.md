# qw-wechat-vercel
基于vercel的serverless服务，把通义千问大模型接入微信公众号

### 必要条件

1. 有一个域名

>这个条件我觉得已经相当低了，至少成本比服务器要少很多吧。`xyz、fun、asia` 结尾的域名只要6-14块一年。

### 操作指南

1. 注册阿里云，点击此链接[【模型服务灵积】](https://dashscope.console.aliyun.com/overview)，开通阿里模型服务灵积。
2. 开通成功左侧菜单找到`管理中心`->`API-KEY管理`，创建apiKey,
3. 去阿里云购买个你喜欢的域名，最便宜的那种就行。买完增加`cname`解析到`cname-china.vercel-dns.com`
4. 注册微信公众号，个人订阅号就行。后台管理页面上找到`设置与开发`-`基本配置`-`服务器配置`，修改服务器地址url为`https://你的域名/api/spark-wechat`，`TOKEN`是自定义的，随便编一个。`EncodingAESKey`随机生成(~~反正我们不用这一项~~)，我们选明文模式就好了。先不要提交，提交会校验TOKEN，所以等下一步我们部署好了再进行操作。
5. ~~fork本项目到你自己的仓库，访问[【Vercel】](https://vercel.com/)使用github账号登录就好了。然后新建项目，选择`Import Git Repository`从github仓库导入。~~（参照下方的一键部署按钮来完成） ~~在`Environment Variables`选项卡，增加环境变量~~把下面的变量一项一项的加进去：
```
API_KEY=sk-xxxx
KEYWORD_REPLAY={"测试":"关键词回复"}
API_MODEL=qwen-72b-chat
WX_TOKEN=xxxx
SUBSCRIBE_REPLY=欢迎关注，我已经接入了阿里千问智能AI，对我说句哈喽试试吧
```
~~填完之后点击`Deploy`，等待部署完成后，点击`settings`找到`Domain`，把你的域名填上去就好了，会自动加https~~

5. 这个时候回到微信后台，可以点击提交了，不出意外的话，会提示`token验证成功`，到外边，启用服务器配置。ok，大功告成。现在你有一个接入星火认知大模型的微信公众号聊天机器人了。

### 一键部署流程

1. 点击此按钮，一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?s=https://github.com/LuhangRui/qw-wechat-vercel)

2. 填写项目名称，点击`create`按钮创建
![3b87cc3a19c5f47430571536714972e](https://github.com/SuxueCode/WechatBakTool/assets/30895030/9af7f9a5-2f22-4244-bcea-b12cd7806e96)

3. 部署成功后，点击`ADD Domain`去添加域名
![210b674bf9c2c7ea4bde3e3e681cb31](https://github.com/SuxueCode/WechatBakTool/assets/30895030/5359086b-8e88-4813-9ee1-8634678d5f4c)

4. 在图示部分添加域名
![27370f6819f41f190f12129f17c1973](https://github.com/SuxueCode/WechatBakTool/assets/30895030/f575544c-74c0-4026-8c7a-4c96fad0a279)

5. 点击左侧环境变量选项，填写环境变量，最后点击`Save`保存
![bd94c35bc843474a073ab7fe98d64ce](https://github.com/SuxueCode/WechatBakTool/assets/30895030/3a9f3520-724a-452c-b840-9177282e9e68)

6. 保存完环境变量后需要重新部署一次加载环境变量，点击`Deployment`选项卡，找到最后一次部署记录，点击`...`，选择`redeploy`
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/40910f52-1af8-47d6-892a-9ce8d1117183)
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/c72defce-9ea2-48e0-809f-2a748a6ed498)


### QA

#### 部署完成后为什么放问会404啊？

不用纠结为什么会404，我们使用的是vercel的serverless能力，我们项目里没有部署页面。所以访问首页会404，这是正常的。
如果要确认是否部署成功，请看一下一个问题。

#### 部署成功的特征是什么？

答：访问路径`https://你的域名/api/qw-wechat`，页面输出`failed`，即为部署成功，可以去微信公众平台提交开发配置，验证`token`。

#### 公众号验证token成功，但是发送消息没反应啊？

答：检查微信公众平台开发配置有没有启用。`Vercel`环境变量是否正确，务必注意环境变量的大小写情况以及命名方式是蛇形，不是驼峰。
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/d9312742-51ed-408a-a98e-f1ce776f7664)
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/b52a6baa-5493-4ed9-aefd-b54bff571d14)

#### 为什么有时候会忘记之前的对话

答：`serverless`服务是一种无状态的服务，每次请求都是一个新的生命周期，只有在两次请求相距时间很短的情况下才有可能会复用上个生命周期，呈现出记录了上次对话的状态。因此，如果模型忘记了上次对话才是常态，记住了，才是取巧。

#### 通义千问目前模型支持情况
##### 限时免费
1. 通义千问72B  qwen-72b-chat

2. 通义千问1.8B  qwen-1.8b-chat

3. 通义千问 qwen-max

4. 通义千问 qwen-max-1201

5. 通义千问 qwen-max-longcontext
##### 送100wToken
1. 通义千问14B  qwen-14b-chat
2. 通义千问7B   qwen-7b-chat
3. 通义千问     qwen-plus
##### 送200wToken
1. 通义千问 qwen-turbo

#### 能不能接入其他大模型啊？

答：不一定有精力，后续看一下。一般来说，不能白嫖的是不接入的。目前支持的有：

[星火认知大模型](https://github.com/LuhangRui/spark-wechat-vercel)

[通义千问大模型](https://github.com/LuhangRui/qw-wechat-vercel)


#### 有没有作者联系方式，有问题需要咨询？

答：关注我的微信公众号，然后你自然就会知道怎么找到我。
![image](https://github.com/SuxueCode/WechatBakTool/assets/30895030/0a508949-ca25-4394-9d51-062c5334d020)