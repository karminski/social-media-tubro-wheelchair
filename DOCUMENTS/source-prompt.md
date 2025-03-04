## Auto Liker

我想写一个社交媒体自动点赞的油猴脚本。实现以下几个功能：
- 自动滚动浏览器和点赞
- 有个计数器，每个点赞操作之间随机sleep 0.5-1.5s
- 如果已经点赞过的就不点赞了

相关html结构如下：

```
<div data-index="0" data-active="true" class="wbpro-scroller-item"><div class="woo-panel-main woo-panel-top woo-panel-right woo-panel-bottom woo-panel-left Card_wrap_2ibWe Card_bottomGap_2Xjqi MessageCmt_wrap_MrtA_"><!----><!----><div class="woo-box-flex MessageCmt_item1_iHhqM"><div><a href="/u/1783721710" class="ALink_default_2ibt1" to="/u/1783721710"><div class="woo-avatar-main woo-avatar-hover" usercard="1783721710" style="width: 3.125rem; height: 3.125rem;"><img src="https://tvax1.sinaimg.cn/crop.0.0.1080.1080.180/6a516eeely8hq4i8ona8qj20u00u0gop.jpg?KID=imgbed,tva&amp;Expires=1741073090&amp;ssig=%2BZjg04YLuq" usercard="1783721710" class="woo-avatar-img"><!----><!----><div class="woo-avatar-hoverMask"></div></div></a></div><div class="woo-box-item-flex MessageCmt_con1_289x9"><div class="woo-box-flex woo-box-alignCenter MessageCmt_h3_2gOAo"><a href="/u/1783721710" class="ALink_default_2ibt1" to="/u/1783721710">366天的纸飞机呐</a><a class="ALink_none_1w6rm" target="_blank"></a></div><div class="MessageCmt_from_3lflx"><a href="//weibo.com/2169039837/PgPTPzAFQ?cid=5140443445857060">27分钟前</a><span class="MessageCmt_cutfrom_1usc3">来自 vivo X Fold3 Pro</span></div><div class="MessageCmt_wbtext_1WE_V MessageCmt_textImg_2MweL">mac mini ultra吗</div></div><div class="woo-box-flex"><div class="woo-pop-wrap morepop_more_3ssan"><span class="woo-pop-ctrl"><div class="woo-box-flex woo-box-alignCenter woo-box-justifyCenter morepop_moreIcon_1RvP9"><i class="woo-font woo-font--angleDown morepop_action_bk3Fq" title="更多"></i></div></span><!----></div></div></div><div class="MessageCmt_repeatbox_1aNPP"><!----><!----><div><a class="ALink_none_1w6rm" target="_blank"><div class="woo-box-flex card-link_wrap_1ktKS"><div class="woo-picture-main woo-picture-square woo-picture-hover" style="width: 5rem; height: 5rem;"><!----><img src="https://wx4.sinaimg.cn/thumb300/bb8b8fbcgy1hz345fwgj9j20wr1z0x3m.jpg" class="woo-picture-img"><!----><div class="woo-picture-hoverMask"></div><!----></div><div class="woo-box-item-flex card-link_wbtext_1afrg card-link_mid_2Ufs1" style="align-self: center;"><h4 class="card-link_title_1v5fP card-link_cut_t4gPQ">@karminski-牙医</h4><!----><div class="card-link_text_2v0Ga card-link_cut2_2ynlV card-link_messText_2YB75">就等Ultra了<img alt="[开学季]" title="[开学季]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/72/2021_kaixueji_org.png"></div><!----></div></div></a><!----></div></div><footer><div class="woo-box-flex woo-box-justifyBetween bottom_side_3m4x4 bottom_left_3LCkV bottom_main_1j6yM"><div class="woo-box-item-flex bottom_item_16QtU"><div class="woo-box-flex woo-box-alignCenter woo-box-justifyCenter bottom_wrap_1Hf4D"><div class="woo-box-flex woo-box-alignCenter woo-box-justifyCenter bottom_iconWrap_1YVnb"><i class="woo-font woo-font--comment bottom_commentIcon_3U10L"></i></div><span class="bottom_num_GZW1N"> 回复 </span></div><!----></div><div class="woo-box-item-flex bottom_item_16QtU"><!----><button class="woo-like-main bottom_btn_3lCGs" tabindex="0"><span class="woo-like-iconWrap"><svg class="woo-like-icon"><use xlink:href="#woo_svg_like"></use></svg></span><span class="woo-like-count">赞</span><!----></button></div><!----></div></footer></div></div>
```

需要按照button元素 class=woo-like-main来遍历寻找。

如何识别是否点过赞可以参考下面的html。这个是没点赞的：

```
<button class="woo-like-main bottom_btn_3lCGs" tabindex="0"><span class="woo-like-iconWrap"><svg class="woo-like-icon"><use xlink:href="#woo_svg_like"></use></svg></span><span class="woo-like-count">赞</span><!----></button>
```

这个是已经点赞过的（这种就不需要再点赞了）：

```
<button class="woo-like-main bottom_btn_3lCGs" tabindex="0"><span class="woo-like-iconWrap"><svg class="woo-like-icon"><use xlink:href="#woo_svg_liked"></use></svg></span><span class="woo-like-count woo-like-liked">1</span><!----></button>
```

然后在浏览器画面的右上角展示一个panel，这个面板展示计数器点赞了多少微博。以及有当前脚本的启动和停止按钮。另外还有一个缩小按钮。点击后panel收起为一个角标在最右侧。panel半透明

