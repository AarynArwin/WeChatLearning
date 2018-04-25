// pages/image-share/image-share.js
import util from '../../utils/util'

const app = getApp();
var userId = wx.getStorageSync('user').userid;    // 存储在本地的用户ID
Page({
  data: {
    windowWidth: 0,
    windowHeight: 0,
    contentHeight: 0,
    ava: 0,
    nickName: 'Aaryn',
    thinkList: [],
    footer: '',
    offset: 0,
    lineHeight: 18,
    img1: 0,
    img2: 0,
    title: 'fordearme',
    content: '',
    
  },

  onLoad: function (options) {
    let that = this;
    var userartId = options.userartId;
   // 获取设备的屏幕信息设置文章宽高
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          windowWidth: res.windowWidth,
          windowHeight: res.windowHeight,
          offset: (res.windowWidth - 300) / 2
        });
      }
    });

    // 从后台接口获取要展示的二维码，这里的获取结果是二维码在自己服务器的访问路径
    wx.request({
      url: 'https://www.fordearme.com/fordearmeforlogin/createwxaqrcode.do',
      success: function (res) {
        that.setData({
          erCodeUrl: res.data.extend.insertCodeImg,
        });
      }
    });
    // 从后台接口获取要展示的文章的信息，从后台可以获取到需要展示的所有内容
    wx.request({
      url: 'https://www.fordearme.com/fordearmeforlogin/selectOneUserArt.do?userartid=' + userartId + '&userid=' + userId,
      success: function (res) {
        that.setData({
          content: res.data.extend.userArtList.userArt.userartcontent,
          title: res.data.extend.userArtList.userArt.userarttitle,
          nickName: res.data.extend.userArtList.username,
          usertx : res.data.extend.userArtList.userava,
          userartimg : res.data.extend.userArtList.imgList[0].imgurl,
        });
        
      }
    })
    // 此处使用延时函数再开始进行页面渲染是因为有可能你的请求还没有完成，页面开始渲染就会取不到内容，那么最终的截图就会出现大片的空白
    setTimeout(function () {
      that.getData()
    }, 1000); 
  },
  onShow: function () {

  },
// 这里的递归是参考的一位前辈的博客进行的，其实整个功能的完成也得益于该前辈的博客启发，大家有疑问的也可以去看看前辈的基础功能
  getData: function () {
    let that = this;
    let i = 0;
    let lineNum = 1;
    let thinkStr = '';
    let thinkList = [];
    for (let item of that.data.content) {
      if (item === '\n') {
        thinkList.push(thinkStr);
        thinkList.push('a');
        i = 0;
        thinkStr = '';
        lineNum += 1;
      } else if (i === 25) {
        thinkList.push(thinkStr);
        i = 1;
        thinkStr = item;
        lineNum += 1;
      } else {
        thinkStr += item;
        i += 1;
      }
    }
    thinkList.push(thinkStr);
    that.setData({ thinkList: thinkList });
    that.createNewImg(lineNum);
  },

  // 画矩形的方法
  drawSquare: function (ctx, height) {
    ctx.rect(10, 10, this.data.windowWidth, height);
    ctx.setFillStyle("White");
    ctx.fill()
  },
  // 放置昵称的方法
  drawNickName: function (ctx, nickName, height) {
    ctx.setFontSize(16);
    ctx.setFillStyle("#484a3d");
    ctx.fillText(nickName, this.data.offset + 50, height + 20);
  },
  // 放置标题的方法
  drawTitle: function (ctx, title, height) {
    ctx.setFontSize(16);
    ctx.setFillStyle("black");
    ctx.fillText(title, this.data.offset, height);
  },
  // 放置内容的方法
  drawFont: function (ctx, content, height) {
    ctx.setFontSize(12);
    ctx.setFillStyle("black");
    ctx.fillText(content, this.data.offset, height);
  },
  // 放置页面二维码旁的描述文字
  drawFont2: function (ctx, content, width, height) {
    ctx.setFontSize(10);
    ctx.setFillStyle("#484a3d");
    ctx.fillText(content, width, height);
  },
  // 这里的划线的方法我没有用到，但是刚开始可能会需要，方便对各部分的区域进行大致的划分
  drawLine: function (ctx, height) {
    //ctx.beginPath();
    ctx.moveTo(this.data.offset, height);
    ctx.lineTo(this.data.windowWidth - this.data.offset, height);
    ctx.stroke('#eee');
    ctx.closePath();
  },
  // 这里是开始画整个图片的方法
  createNewImg: function (lineNum) {
    let that = this;
    let ctx = wx.createCanvasContext('myCanvas');
    let contentHeight = lineNum * that.data.lineHeight + 425;

    that.drawSquare(ctx, contentHeight);
    that.setData({ contentHeight: contentHeight });
    let height = 60;
    // 设置用户头像的背景图片，目的是为了显示的头像是圆形头像，毕竟方形的头像展示会比较跟微信的圆形展示头像不相符。
    ctx.drawImage("../../images/bg2.jpg", 0, 0, 375, lineNum * that.data.lineHeight + 435);
    // 设置用户头像
    const downloadTask = wx.downloadFile({
      url: that.data.usertx,         
      success: function (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          var img = res.tempFilePath;
          if (that.data.ava == 1) {
            ctx.drawImage(img, that.data.windowWidth - that.data.offset - 295, lineNum * that.data.lineHeight + 18 , 35, 35);
            ctx.drawImage("../../images/tx.png", that.data.windowWidth - that.data.offset - 295, lineNum * that.data.lineHeight + 18, 35, 35);
          }
        }
      }
    })
    // 监控图片的下载进度，以下的两个下载图片的方法功能雷同，这样才能在最终渲染页面的时候知道图片是否已经下载完成
    downloadTask.onProgressUpdate((res) => {
      if (res.progress == 100) {
        that.setData({ ava: 1 });
      }
    })
    // 设置用户的昵称
    that.drawNickName(ctx, that.data.nickName, height - 15);
    // 设置内容的标题
    that.drawTitle(ctx, that.data.title, height + 50);
    // 设置内容
    for (let item of that.data.thinkList) {
      if (item !== 'a') {
        that.drawFont(ctx, item, height + 70);
        height += that.data.lineHeight;
      }
    }
    // 绘制用户内容的图片（存在的情况下）
    const downloadTask1 = wx.downloadFile({
      url: that.data.userartimg,          //仅为示例，并非真实的资源
      success: function (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          var img = res.tempFilePath;
          if (that.data.img1 == 1) {
            ctx.drawImage(img, that.data.windowWidth - that.data.offset - 300, lineNum * that.data.lineHeight + 130, 300, 180)  
          }
        }
      }
    })
    downloadTask1.onProgressUpdate((res) => {
      if (res.progress == 100) {
        that.setData({ img1: 1 });
      }
    })

    // 绘制小程序页面二维码
    const downloadTask2 = wx.downloadFile({
      url: that.data.erCodeUrl, //仅为示例，并非真实的资源
      success: function (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          var img = res.tempFilePath;
          if (that.data.img2 == 1) {
            ctx.drawImage(img, that.data.windowWidth - that.data.offset - 245, lineNum * that.data.lineHeight + 320, 80, 80);
          }
        }
      }
    })
    downloadTask2.onProgressUpdate((res) => {
      if (res.progress == 100) {
        that.setData({ img2: 1 });
      }
    })
    that.drawFont2(ctx, '长 按 识 别 小 程 序', 190, lineNum * that.data.lineHeight + 355);
    // 而这里的延时函数是为了给图片预留下载时间，否则可能由于图片没有下载完成图片已经开始渲染，那么就会导致有部分的内容是空白的，所以这里最重要的就是需要我们对需要下载的几项内容的完成情况进行监控，只有当所有需要的素材都下载完成后再进行页面的渲染，这里的时间可以自己调整，如果等待时间过程可能会造成用户体验不是很好。
    setTimeout(function () {
      // 内容不存在用户图片的情况下
      if (that.data.userartimg == ''){
        if (that.data.img2 == 1 && that.data.ava== 1) {
          ctx.draw();
        }
        // 存在用户图片的情况下
      }else{
        if (that.data.img2 == 1 && that.data.img1 == 1 && that.data.ava == 1) {
          ctx.draw();
        }
      }    
    }, 3000);
  },
// 这里是保存用户图片的方法
  savePic: function () {
    let that = this;
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: that.data.windowWidth,
      height: that.data.contentHeight,
      canvasId: 'myCanvas',
      success: function (res) {
        wx.previewImage({
          urls: [res.tempFilePath]
        })
      }
    })
  },


});