/**
 * @file
 * @author oupeng-fe
 * @version 1.1
 * webapp通用组件
 * pic-reader   -   图片预览
 * @require lib/class.js
 * @require lib/util.js
 * @require lib/dom.js
 * @require lib/event.js
 * @require widget/widget.js
 * @require widget/mask/mask.js
 * @require widget/slider/slider.js
 */
;(function(o, undefined) {

    "use strict";

    /**
     * @class
     * @parent octopus.Widget.Mask
     * @param opts 传入的参数
     * @param opts.imgEl {DOMElement} 可以通过传入一个节点解析节点下所有的img标签
     * @param opts.imgs {Array} 解析的img标签集合 可以与imgEl共存
     * @param opts.maxW {Number} 屏幕的宽度 可传可不传 传的好处少一次repaint
     * @param opts.maxH {Number} 屏幕的高度减去60px 可传可不传 同上
     * @param opts.hasButton {Boolean} 同octopus.Widget.Slider中的hasButton 默认为false
     * @param opts.hasGizmos {Boolean} 同上 默认为false
     * @param opts.hasTitle {Boolean} 同上 默认为false
     */
    o.Widget.PicReader = o.define(o.Widget.Mask, {

        /**
         * @private
         * @property imgEl
         * @type {DOMElement}
         * @desc 图片阅读涉及到的根结点
         */
        imgEl: null,

        /**
         * @private
         * @property sliderEl
         * @type {DOMElement}
         * @desc 里面一些东西的容器
         */
        sliderEl: null,

        /**
         * @private
         * @property imgCEl
         * @type {DOMElement}
         * @desc 显示区域图片的容器
         */
        imgCEl: null,

        /**
         * @private
         * @property isResize
         * @type {Boolean}
         * @desc 标志位 为了让resize触发的再少一些
         */
        isResize: false,

        /**
         * @private
         * @property maxW
         * @type {Number}
         * @desc 屏幕的宽度
         */
        maxW: null,

        /**
         * @private
         * @property maxH
         * @type {Number}
         * @desc 屏幕的高度减去60
         */
        maxH: null,

        /**
         * @private
         * @property imgs
         * @type {Array}
         * @desc 传入的图片节点集合
         */
        imgs: null,

        /**
         * @private
         * @property datas
         * @type {Array}
         * @desc 生成slider的数据
         */
        datas: null,

        /**
         * @private
         * @property slider
         * @type {Object}
         */
        slider: null,

        /**
         * @private
         * @property hasButton
         * @type {Boolean}
         * @desc 生成slider用的参数
         */
        hasButton: false,

        /**
         * @private
         * @property hasGizmos
         * @type {Boolean}
         * @desc 生成slider用的参数
         */
        hasGizmos: false,

        /**
         * @private
         * @property hasTitle
         * @type {Boolean}
         * @desc 生成slider用的参数
         */
        hasTitle: false,

        /**
         * @private
         * @constructor
         */
        initialize: function() {
            o.Widget.Mask.prototype.initialize.apply(this, arguments);
            this.imgs = this.imgs || [];
            this.datas = this.datas || [];
            if(this.imgEl) {
                this.initImgEvent();
            }
            this.animation = "fade";
            var that = this;
            o.event.on(window, "ortchange", function() {
                if(!that.isResize) {
                    o.util.requestAnimation(o.util.bind(that.checkSize, that));
                    that.isResize = true;
                }
            }, false);
            this.buildSlider();
        },

        /**
         * @private
         * @method checkSize
         * @desc 用于浏览器resize时对于屏幕宽高的重新获取
         */
        checkSize: function() {
            this.maxW = o.dom.getScreenWidth();
            this.maxH = o.dom.getScreenHeight() - 60;
            this.slider.el.style.height = this.maxH + "px";
            this.calcRect(o.one("img", this.imgCEl));
            this.isResize = false;
        },

        /**
         * @private
         * @method buildSlider
         * @desc 生成节点
         */
        buildSlider: function() {
            this.sliderEl = o.dom.createDom("div", {
                "class": "octopusui-reader-slidercontainer"
            });
            this.imgCEl = o.dom.createDom("div", {
                "class": "octopusui-reader-imgcontainer"
            });
            var fragment = document.createDocumentFragment(),
                imgdom = o.dom.createDom("img", {
                    "class": "octopusui-reader-img"
                }),
                closedom = o.dom.createDom("div", {
                    "class": "octopusui-reader-close"
                });
            this.imgCEl.appendChild(imgdom);
            fragment.appendChild(this.imgCEl);
            fragment.appendChild(closedom);
            this.sliderEl.appendChild(fragment);
            this.el.appendChild(this.sliderEl);
        },

        /**
         * @private
         * @method initImgEvent
         */
        initImgEvent: function() {
            var imgs = o.$("img", this.imgEl);
            if(!imgs)   return;
            o.util.each(this.imgs, o.util.bind(this.addImgEvent, this));
            o.util.each(imgs, o.util.bind(this.addImgEvent, this));
            this.slider = new o.Widget.Slider({
                data: this.datas,
                hasButton: this.hasButton,
                autoPlay: false,
                loop: false,
                hasGizmos: this.hasGizmos,
                hasTitle: this.hasTitle,
                loadImageNumber: 1,
                isDisableA: true,
                disScroll: true,
                id: "octopusui-reader-slider"
            });
        },

        /**
         * @private
         * @method addImgEvent
         * @param item
         * @param index
         */
        addImgEvent: function(item, index) {
            if(!o.util.isNode(item) || !item.src)    return;
            this.imgs.push(item);
            var that = this,
                src = item.src;
            o.util.loadImage(src, function() {
                o.dom.data(item, {
                    "octopusui-reader-width": this.width,
                    "octopusui-reader-height": this.height,
                    "octopusui-reader-index": index
                });
            }, function() {
                that.gesture(item).on("tap", o.util.bind(that.itemOnTap, that));
            }, o.util.empty);
            var data = {
                title: o.dom.data(item, "octopusui-reader-title") || "",
                url: o.dom.data(item, "octopusui-reader-url") || "",
                image_url: o.dom.data(item, "octopusui-reader-src") || src
            };
            this.datas.push(data);
        },

        /**
         * @private
         * @method itemOnTap
         */
        itemOnTap: function(e) {
            o.event.stop(e);
            var target = e.target;
            this.active ? this.show(target) : this.render(this.container || document.body, false, target);
        },

        /**
         * @public
         * @method octopus.Widget.PicReader.render
         */
        render: function(container, clone, dom) {
            this.slider.container = this.sliderEl;
            this.slider.el.style.visibility = "hidden";
            this.slider.isShow = false;
            this.sliderEl.appendChild(this.slider.el);

            o.Widget.prototype.render.apply(this, arguments);
            this.maxW = this.maxW || o.dom.getScreenWidth();
            this.maxH = this.maxH || o.dom.getScreenHeight() - 60;
            this.slider.activate();
            this.slider.el.style.cssText = "height: " + this.maxH + "px; width: 100%; overflow: hidden; " +
                "display: none; left: 0; top: 0; bottom: 0; right: 0; margin: auto; position: absolute;";
            this.domEmerged(dom);
        },

        /**
         * @public
         * @method octopus.Widget.PicReader.show
         */
        show: function(dom) {
            o.Widget.Mask.prototype.show.apply(this, arguments);
            if(!dom)    return;
            this.domEmerged(dom);
        },

        /**
         * @private
         * @method _hidden
         */
        _hidden: function() {
            o.Widget.Mask.prototype._hidden.apply(this, arguments);
            this.imgCEl.style.display = "block";
            this.slider.hidden();
        },

        /**
         * @private
         * @method domEmerged
         */
        domEmerged: function(dom) {
            var clonedom = dom.cloneNode(),
                _clone = o.dom.cloneNode(this.imgCEl, true, true);
            _clone.appendChild(clonedom);
            this.sliderEl.replaceChild(_clone, this.imgCEl);
            this.imgCEl = _clone;
            this.calcRect(dom);
        },

        /**
         * @private
         * @method loadLargeImg
         */
        loadLargeImg: function(el) {
            var src = o.dom.data(el, "octopusui-reader-src"),
                that = this;
            if(!src || o.dom.data(el, "octopusui-reader-loaded")) {
                this.changedVisible();
            } else {
                if(!o.dom.hasClass(this.imgCEl, "octopusui-reader-loading")) {
                    o.dom.addClass(this.imgCEl, "octopusui-reader-loading");
                }
                o.util.loadImage(o.dom.data(el, "octopusui-reader-src"), o.util.empty, function() {
                    that.changedVisible(el);
                }, function() {
                    that.changedVisible(el);
                });
            }
        },

        /**
         * @private
         * @method changedVisible
         */
        changedVisible: function() {
            if(o.dom.hasClass(this.imgCEl, "octopusui-reader-loading")) {
                o.dom.removeClass(this.imgCEl, "octopusui-reader-loading");
            }
            if(arguments[0]) {
                o.dom.data(arguments[0], {
                    "octopusui-reader-loaded": "true"
                });
            }
            this.slider.show();
            this.imgCEl.style.display = "none";
        },

        /**
         * @private
         * @property calcScreen
         */
        calcRect: function() {
            var el = arguments[0],
                rect = el.getBoundingClientRect(),
                rw = rect.width,
                rh = rect.height,
                w = o.dom.data(el, "octopusui-reader-width") || rw,
                h = o.dom.data(el, "octopusui-reader-height") || rh,
                t = rect.top,
                l = rect.left,
                maxW = this.maxW,
                maxH = this.maxH,
                _w,
                _h,
                _t,
                _l;
            if(w <= maxW && h <= maxH) {
                _t = (maxH - h) / 2 + 30;
                _l = (maxW - w) / 2;
                _w = w;
                _h = h;
            } else {
                if(w > h) {
                    _w = maxW;
                    _l = 0;
                    _h = h * _w / w;
                    _t = (maxH - _h) / 2 + 30;
                } else {
                    _h = maxH;
                    _t = 30;
                    _w = w * _h / h;
                    _l = (maxW - _w) / 2;
                }
            }
            this.slider.select(o.dom.data(el, "octopusui-reader-index") - 0);

            this.sliderAnimate(["left", "top", "width", "height"], [l, t, rw, rh], [_l, _t, _w, _h], el);
        },

        /**
         * @private
         * @method sliderAnimate
         */
        sliderAnimate: function(props, svs, evs, el) {
            var that = this;
            return new o.Tween(this.imgCEl, props, svs, evs, .4, function() {
                that.loadLargeImg(el);
            }, {
                ease: "ease-out",
                delay: .4
            });
        },

        CLASS_NAME: "octopus.Widget.PicReader"
    });

})(octopus);