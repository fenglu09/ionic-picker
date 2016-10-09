var PickerModule = angular.module('ionicPicker', []);

PickerModule.factory('PickerUtil', function () {

    var isSupportTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);

    var _touchEvents = {
        start: isSupportTouch ? 'touchstart' : 'mousedown',
        move: isSupportTouch ? 'touchmove' : 'mousemove',
        end: isSupportTouch ? 'touchend' : 'mouseup'
    };

    var _getTranslate = function (el, axis) {
        var matrix, curTransform, curStyle, transformMatrix;

        // automatic axis detection
        if (typeof axis === 'undefined') {
            axis = 'x';
        }
        // 获取应用在el元素上面的style值
        curStyle = window.getComputedStyle(el, null);
        if (window.WebKitCSSMatrix) {
            // Some old versions of Webkit choke when 'none' is passed; pass
            // empty string instead in this case
            transformMatrix = new WebKitCSSMatrix(curStyle.webkitTransform === 'none' ? '' : curStyle.webkitTransform);
        }
        else {
            transformMatrix = curStyle.MozTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
            matrix = transformMatrix.toString().split(',');
        }

        if (axis === 'x') {
            //Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix)
                curTransform = transformMatrix.m41;
            //Crazy IE10 Matrix
            else if (matrix.length === 16)
                curTransform = parseFloat(matrix[12]);
            //Normal Browsers
            else
                curTransform = parseFloat(matrix[4]);
        }
        if (axis === 'y') {
            //Latest Chrome and webkits Fix
            if (window.WebKitCSSMatrix)
                curTransform = transformMatrix.m42;
            //Crazy IE10 Matrix
            else if (matrix.length === 16)
                curTransform = parseFloat(matrix[13]);
            //Normal Browsers
            else
                curTransform = parseFloat(matrix[5]);
        }

        return curTransform || 0;
    };

    var _transition = function (el, duration) {

        el = angular.element(el)[0];
        if (typeof duration !== 'string') {
            duration = duration + 'ms';
        }
        var elStyle = el.style;
        elStyle.webkitTransitionDuration = elStyle.MozTransitionDuration = elStyle.transitionDuration = duration;

    };

    var _transform = function (el, transform) {
        el = angular.element(el);
        el.css({
            '-webkit-transform': transform,
            'transform': transform
        });
    };
    /**
     * 使用requestAnimationFrame方式，让动画更加流畅。
     * 优先使用requestAnimationFrame，如果不支持，则使用setTimeout
     * @param callback
     * @returns {*}
     * @private
     */
    var _requestAnimationFrame = function (callback) {
        if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
        else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
        else if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame(callback);
        else {
            return window.setTimeout(callback, 1000 / 60);
        }
    };
    var _cancelAnimationFrame = function (id) {
        if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
        else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
        else if (window.mozCancelAnimationFrame) return window.mozCancelAnimationFrame(id);
        else {
            return window.clearTimeout(id);
        }
    };

    function __dealCssEvent(eventNameArr, callback) {
        var events = eventNameArr,
            i, dom = this;// jshint ignore:line

        function fireCallBack(e) {
            /*jshint validthis:true */
            if (e.target !== this) return;
            callback.call(this, e);
            for (i = 0; i < events.length; i++) {
                dom.off(events[i], fireCallBack);
            }
        }

        if (callback) {
            for (i = 0; i < events.length; i++) {
                dom.on(events[i], fireCallBack);
            }
        }
    }

    var _animationEnd = function (callback) {
        __dealCssEvent.call(this, ['webkitAnimationEnd', 'animationend'], callback);
        return this;
    };
    var _transitionEnd = function (element, callback) {
        var _this = angular.element(element);
        __dealCssEvent.call(_this, ['webkitTransitionEnd', 'transitionend'], callback);
        return this;
    };
    var _isIOS = function () {
        var ua = navigator.userAgent;
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
        if (ipad || iphone || ipod) {
            return true;
        }
        return false;
    };
    var _getIndex = function (value, dataArray) {
        for (var i = 0, len = dataArray.length; i < len; i++) {

            if (angular.equals(value, dataArray[i])) {
                return i;
            }
        }
        return -1;
    };
    return {
        touchEvents: _touchEvents,
        isIOS: _isIOS,
        transform: _transform,
        getTranslate: _getTranslate,
        transition: _transition,
        cancelAnimationFrame: _cancelAnimationFrame,
        requestAnimationFrame: _requestAnimationFrame,
        animationEnd: _animationEnd,
        transitionEnd: _transitionEnd,
        getIndex: _getIndex
    }
});
/**
 * label： input的label,
 * picker-data: 用户选择的数据
 * picker-title： 现实在pick-modal上面的title
 */
PickerModule.directive('ionicPicker', ['$ionPicker', 'PickerUtil', function ($ionPicker, PickerUtil) {
    return {
        restrict: 'E',
        scope: {
            pickerData: '=?pickerData',
            selectData: '=?ngModel'
        },
        template: //
        '<label class=" item-input item-select">' +
        '   <span class="input-label ">{{inputLabel}}</span>' +
        '   <div class="input select-value" ng-bind="displayValue"></div>' +
        // '   <input type="text" readonly="readonly" ng-model="displayValue"/>' +
        '</label>',
        replace: true,
        link: function (scope, element, attr) {
            scope.inputLabel = attr.label || '';
            scope.displayValue = '';
            scope.multiple = attr.multiple == 'true';
            scope.required = (attr.required == 'true' || attr.required == true);

            if (angular.isUndefined(scope.pickerData) || !angular.isArray(scope.pickerData)) {
                return;
            }
            scope.isItemObject = angular.isObject(scope.pickerData[0]);
            scope.viewValueProperty = attr.viewValueProperty || 'name';

            if (scope.multiple) {
                // 多选
                scope.selectData = scope.selectData ? scope.selectData : [];
                if (scope.selectData.length !== 1) {
                    scope.displayValue = '选择了' + scope.selectData.length + '项';
                } else {
                    scope.displayValue = scope.isItemObject ? scope.selectData[scope.viewValueProperty] : scope.selectData;
                }
            } else {
                // 单选默认第一个
                if (scope.selectData) {
                    scope.displayValue = scope.isItemObject ? scope.selectData[scope.viewValueProperty] : scope.selectData;
                } else {
                    if (!scope.required) {
                        // 如果不是必填
                        var temp = {};
                        if (scope.isItemObject) {
                            temp[scope.viewValueProperty] = '请选择'
                        } else {
                            temp = '请选择';
                        }
                        scope.pickerData.unshift(temp);
                    } else {
                        scope.selectData = scope.pickerData[0];
                    }
                    scope.displayValue = scope.isItemObject ? scope.pickerData[0][scope.viewValueProperty] : scope.pickerData[0];
                }
            }


            scope.preValue = '';
            // 绑定点击事件
            element.on('click', function (e) {
                e.preventDefault();

                scope.preValue = angular.copy(scope.selectData);

                var options = {
                    cols: [{
                        values: scope.pickerData,
                        currentValue: scope.selectData,
                        viewValueProperty: scope.viewValueProperty,
                        isItemObject: scope.isItemObject,
                        onChange: setValue
                    }],
                    required: scope.required,
                    multiple: scope.multiple
                };
                scope.$on('picker.cancel', function (e) {
                    setValue(scope.preValue, true);
                });
                function setValue(newValue, isReset) {
                    scope.$apply(function () {

                        if (scope.multiple) {
                            // 多选
                            if (isReset) {
                                scope.selectData = angular.copy(scope.preValue);
                            } else {
                                var index = PickerUtil.getIndex(newValue, scope.selectData);

                                if (index > -1) {
                                    // 已经存在，则删除
                                    // console.log(scope.selectData.splice(index, 1));
                                    scope.selectData.splice(index, 1);
                                } else {
                                    // 不存在，添加到数组里面
                                    scope.selectData.push(newValue);
                                }
                            }

                            scope.displayValue = scope.selectData.length == 1 ? (scope.isItemObject ?
                                scope.selectData[0][scope.viewValueProperty] : scope.selectData[0]) : '选择了' + scope.selectData.length + '项';
                        } else {
                            var tempDisplayVal = scope.isItemObject ? newValue[scope.viewValueProperty] : newValue;
                            scope.displayValue = tempDisplayVal;
                            scope.selectData = newValue;
                            if (tempDisplayVal == '请选择') {
                                scope.selectData = undefined;
                            }
                        }
                    });
                }

                showPicker(options);
                e.stopPropagation();
            });

            function showPicker(options) {
                $ionPicker.show(options);
            }
        }
    }
}]);
PickerModule.directive('pickerModal', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        scope: true,
        replace: true,
        template: //
        '<div class="picker-modal-backdrop">' +
        ' <div class="picker-modal"  ng-class="{\'multiple-select\': multiple}">' +
        '   <div class="picker-header">' +
        '       <button class="picker-tools-button cancel-button">取消</button>' +
        '       <h2 class="title">请选择</h2>' +
        '       <button class="picker-tools-button ok-button">确定</button>' +
        '   </div>' +
        '   <div class="picker-modal-inner picker-items">' +
        '       <picker-col ng-repeat="col in cols"></picker-col>' +
        '       <div class="picker-center-highlight" ng-if="!multiple"></div>' +
        '   </div>' +
        '</div>' +
        '</div>',
        link: function (scope, element) {
            scope.$apply();
            element[0].querySelector('.cancel-button').addEventListener('click', function () {
                $rootScope.$broadcast('picker.cancel');
            });
        }
    };
}]);
PickerModule.directive('pickerCol', ['$document', '$timeout', 'PickerUtil', function ($document, $timeout, PickerUtil) {

    return {
        restrict: 'E',
        scope: true,
        replace: true,
        template: //
        '<div class="picker-items-col">' +
        '   <div class="picker-col-wrapper">' +
        // '       <div class="picker-item" data-picker-value="" ng-if="!required && !multiple">请选择</div>' +
        '       <div class="picker-item" data-picker-value="{{a}}" ng-repeat="a in col.values">{{ (!required && !multiple && ($index == 0))? \'请选择\' : (col.isItemObject ? a[col.viewValueProperty]: a) }}</div>' +
        '   </div>' +
        '</div>',
        link: function (scope, element) {

            $timeout(function () {
                initCol();
            });

            scope.calcSize = function () {

                scope.colHeight = element[0].offsetHeight;
                scope.wrapperHeight = scope.wrapper.offsetHeight;
                scope.itemHeight = element[0].querySelector('.picker-item').offsetHeight;
                scope.itemsHeight = scope.itemHeight * scope.col.values.length;
                // 原点在wrapper的右上角
                // 滚动到最底部的时候，即滚动到最后一个元素时，此时translate为负数，且最小。
                scope.minTranslate = scope.colHeight / 2 - scope.itemsHeight + scope.itemHeight / 2;
                // 滚动到第一个元素时，此时translate为正，且最大
                scope.maxTranslate = scope.colHeight / 2 - scope.itemHeight / 2;
                scope.colWidth = 0;

                scope.items = element[0].querySelectorAll('.picker-item');
                // angular.forEach(scope.items, function (item) {
                //   var item = angular.element(item);
                //   item.css({width: 'auto'});
                //   scope.colWidth = Math.max(scope.colWidth, item[0].offsetWidth); // 取所有item中的最大的一个
                //   item.css({width: ''});
                // });
                // element.css({width: (scope.colWidth + 2) + 'px'});
                element.css({width: '100%'});

            };
            function initCol() {

                scope.wrapper = element[0].querySelector('.picker-col-wrapper');
                scope.container = element;

                scope.calcSize();
                PickerUtil.transform(scope.wrapper, 'translate3d(0,' + scope.maxTranslate + 'px,0)');
                PickerUtil.transition(scope.wrapper, 0);

                if (scope.multiple) {
                    // 多选， 初始化
                    angular.forEach(scope.col.currentValue, function (value) {
                        scope.setValue(value, 0, false);
                    })
                } else {
                    // 单选
                    if (scope.col.currentValue && scope.col.currentValue !== '') {
                        scope.setValue(scope.col.currentValue);
                    } else {
                        scope.setValue(scope.col.values[0], undefined, true);
                    }
                }

                scope.initEvents();
            }

            /**
             * 动画
             * 由于requestAnimationFrame是一次性的，必须连续不断的调用requestAnimationFrame
             */
            function updateDuringScroll() {
                scope.animationFrameId = PickerUtil.requestAnimationFrame(function () {

                    scope.updateItems(undefined, undefined, 0, !scope.multiple);

                    updateDuringScroll();
                });
            }

            /**
             *
             * @param newValue 更新的值
             * @param transition  css 的 transition-duration 值
             * @param valueCallbacks  是否调用callback方法
             */
            scope.setValue = function (newValue, transition, valueCallbacks) {

                if (angular.isUndefined(transition)) transition = '';

                var newActiveIndex = PickerUtil.getIndex(newValue, scope.col.values);

                if (scope.multiple) {
                    angular.element(scope.items[newActiveIndex]).toggleClass('selected');
                }

                if (angular.isUndefined(newActiveIndex) || newActiveIndex === -1) {
                    scope.setValue(scope.col.values[0]);
                    return;
                }
                var newTranslate = -newActiveIndex * scope.itemHeight + scope.maxTranslate;

                // Update wrapper
                PickerUtil.transition(scope.wrapper, transition);
                PickerUtil.transform(scope.wrapper, 'translate3d(0,' + (newTranslate) + 'px,0)'); // 动画
                //
                // // Watch items
                if (scope.activeIndex && scope.activeIndex !== newActiveIndex) {
                    PickerUtil.cancelAnimationFrame(scope.animationFrameId);
                    PickerUtil.transitionEnd(scope.wrapper, function () {
                        PickerUtil.cancelAnimationFrame(scope.animationFrameId);
                    });
                    updateDuringScroll();
                }
                //
                // // Update items

                scope.updateItems(newActiveIndex, newTranslate, transition, valueCallbacks);
            };

            scope.updateItems = function (activeIndex, translate, transition, valueCallbacks) {

                if (angular.isUndefined(translate)) {
                    // 获取当前的y轴的translate值
                    translate = PickerUtil.getTranslate(scope.wrapper, 'y');
                }

                if (angular.isUndefined(activeIndex)) {
                    // 根据translate的值, 获取activeIndex
                    activeIndex = -Math.round((translate - scope.maxTranslate) / scope.itemHeight);
                }

                // 两种临界情况
                if (activeIndex < 0) activeIndex = 0;
                if (activeIndex >= scope.col.values.length)
                    activeIndex = scope.col.values.length - 1;

                var previousActiveIndex = scope.col.activeIndex;
                scope.col.activeIndex = activeIndex;

                angular.element(scope.wrapper.querySelector('.picker-selected')).removeClass('picker-selected');

                PickerUtil.transition(scope.items, transition);

                angular.element(scope.items[activeIndex]).addClass('picker-selected');

                // 判断是否执行onChange回调方法
                if (valueCallbacks || angular.isUndefined(valueCallbacks)) {
                    // Update values
                    if (scope.multiple) {
                        // 多选
                        if (scope.col.onChange) {
                            scope.col.onChange(scope.col.values[activeIndex]);
                        }
                    } else {
                        // 单选
                        scope.col.currentValue = scope.col.values[activeIndex];
                        if (previousActiveIndex !== activeIndex) {
                            if (scope.col.onChange) {
                                scope.col.onChange(scope.col.values[activeIndex]);
                            }
                        }
                    }
                }
            };

            /**
             * touchstart事件的回调
             * @param e
             */
            function handleTouchStart(e) {
                if (scope.isMoved || scope.isTouched) return;
                e.preventDefault();
                scope.isTouched = true;
                // 初始滑动位置，如果是'touch'事件，则用e.targetTouches[0].pageY，否则用e.pageY
                scope.touchStartY = scope.touchCurrentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
                scope.touchStartTime = (new Date()).getTime();
                scope.allowItemClick = true;
                // 初始滑动的translate值
                scope.startTranslate = scope.currentTranslate = PickerUtil.getTranslate(scope.wrapper, 'y');

            }

            /**
             * 滑动过程中的回调
             * @param e
             */
            function handleTouchMove(e) {
                if (!scope.isTouched) return;
                e.preventDefault();
                scope.allowItemClick = false;
                scope.touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

                if (!scope.isMoved) {
                    // 第一次移动
                    PickerUtil.cancelAnimationFrame(scope.animationFrameId);
                    scope.isMoved = true;
                    scope.startTranslate = scope.currentTranslate = PickerUtil.getTranslate(scope.wrapper, 'y');
                    PickerUtil.transition(scope.wrapper, 0);
                }
                e.preventDefault();
                // 不是第一次移动。 向上滚动时，scope.touchCurrentY < scope.touchStartY;
                // 向下滚动时，scope.touchCurrentY >= scope.touchStartY
                scope.diff = scope.touchCurrentY - scope.touchStartY;
                scope.currentTranslate = scope.startTranslate + scope.diff;
                scope.returnTo = undefined;


                if (scope.currentTranslate < scope.minTranslate) {
                    // 滚动到最底部后继续滚动，将滚动的速率变小，变为原来的80%;
                    scope.currentTranslate = scope.minTranslate - Math.pow(scope.minTranslate - scope.currentTranslate, 0.8);
                    scope.returnTo = 'min';
                }
                if (scope.currentTranslate > scope.maxTranslate) {
                    scope.currentTranslate = scope.maxTranslate + Math.pow(scope.currentTranslate - scope.maxTranslate, 0.8);
                    scope.returnTo = 'max';
                }
                // console.log('touch move currentTranslate', scope.currentTranslate);
                PickerUtil.transform(scope.wrapper, 'translate3d(0,' + scope.currentTranslate + 'px,0)');

                scope.updateItems(undefined, scope.currentTranslate, 0, !scope.multiple);

                // Calc velocity 计算速度
                scope.velocityTranslate = scope.currentTranslate - scope.prevTranslate || scope.currentTranslate;
                scope.velocityTime = (new Date()).getTime();
                scope.prevTranslate = scope.currentTranslate;
            }

            function handleTouchEnd(e) {
                if (!scope.isTouched || !scope.isMoved) {
                    scope.isTouched = scope.isMoved = false;
                    return;
                }
                scope.isTouched = scope.isMoved = false;

                PickerUtil.transition(scope.wrapper, '');

                // 是否超出了界限
                if (scope.returnTo) {
                    if (scope.returnTo === 'min')
                        PickerUtil.transform(scope.wrapper, 'translate3d(0,' + scope.minTranslate + 'px,0)');
                    else
                        PickerUtil.transform(scope.wrapper, 'translate3d(0,' + scope.maxTranslate + 'px,0)');
                }
                scope.touchEndTime = new Date().getTime();

                var velocity, newTranslate;
                if (scope.touchEndTime - scope.touchStartTime > 300) {
                    // 超过300毫秒
                    newTranslate = scope.currentTranslate;
                } else {
                    // velocity = Math.abs(scope.velocityTranslate / (scope.touchEndTime - scope.velocityTime));

                    newTranslate = scope.currentTranslate + scope.velocityTranslate * 7;
                }
                // 取newTranslate 和 maxTranslate 的最小值，有效解决了向下滑动超出的问题
                // 取取newTranslate 和 maxTranslate 的最小值 和 minTranslate 的最大值，有效解决了向上滑动超出的问题
                newTranslate = Math.max(Math.min(newTranslate, scope.maxTranslate), scope.minTranslate);

                // Active Index
                var activeIndex = -Math.floor((newTranslate - scope.maxTranslate) / scope.itemHeight);

                newTranslate = -activeIndex * scope.itemHeight + scope.maxTranslate;
                // Transform wrapper
                PickerUtil.transform(scope.wrapper, 'translate3d(0,' + (parseInt(newTranslate, 10)) + 'px,0)');

                scope.updateItems(activeIndex, newTranslate, '', !scope.multiple);

                updateDuringScroll();
                PickerUtil.transitionEnd(scope.wrapper, function () {
                    PickerUtil.cancelAnimationFrame(scope.animationFrameId);
                });

                $timeout(function () {
                    scope.allowItemClick = true;
                }, 100);

            }

            function handleClick(e) {

                var value = this.dataset.pickerValue;

                if (value !== '') {
                    if (scope.col.isItemObject) {
                        value = JSON.parse(value);
                    }
                    scope.setValue(value);
                }
            }

            scope.initEvents = function (detach) {
                var method = detach ? 'off' : 'on';
                element[method](PickerUtil.touchEvents.start, handleTouchStart);
                element[method](PickerUtil.touchEvents.move, handleTouchMove);
                element[method](PickerUtil.touchEvents.end, handleTouchEnd);
                angular.element(scope.items)[method]('click', handleClick);
            }
        }
    };
}]);
PickerModule.factory('$ionPicker', ['$rootScope', '$compile', '$document', '$animate', '$timeout',
    function ($rootScope, $compile, $document, $animate, $timeout) {
        var $body = $document.find('body');
        return {
            show: showPickerModal
        };

        function showPickerModal(options) {
            var scope = $rootScope.$new(true);

            angular.extend(scope, {}, options);
            var element = scope.element = $compile('<picker-modal></picker-modal>')(scope);
            var pickerEle = angular.element(element[0].querySelector('.picker-modal'));

            scope.removePicker = function (done) {
                if (scope.removed) return;

                scope.removed = true;
                pickerEle.addClass('modal-out');

                $timeout(function () {
                    // 解绑点击事件
                    $body.off('click', removeOnBackdropClick);
                    var okbtn = angular.element(element[0].querySelector('.ok-button'));
                    okbtn.off('click', scope.removePicker);
                    scope.$destroy();
                    element.remove();
                }, 400);
            };
            scope.$on('picker.cancel', function (e) {
                scope.removePicker();
            });
            scope.showPicker = function (done) {
                if (scope.removed) return;

                $body.append(element);
                element.addClass('active');
                bindBackdropEvent();
                bindOkBtnEvent();
                $timeout(function () {
                    if (scope.removed) return;
                    pickerEle.addClass('modal-in');
                }, 20, false);
            };
            function bindOkBtnEvent() {
                var okbtn = angular.element(element[0].querySelector('.ok-button'));
                okbtn.on('click', scope.removePicker)
            }

            function bindBackdropEvent() {
                element.on('click', removeOnBackdropClick);
            }

            // 点击backdrop 移除picker
            function removeOnBackdropClick(e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.target == element[0]) {
                    scope.removePicker();
                }
            }

            scope.showPicker();
        }
    }]);
