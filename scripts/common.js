//页面基类
var Page = function() {
    if (this.init) {
        this.init.apply(this, arguments);
    } else {
        this._init.apply(this, arguments);
    }
}

Page.prototype = {
    //初始化
    init: function() {
        var self = this;

        //获取 url 参数
        this.getUrlParams();

        //生成 heaer
        this.renderHeader();

        //老版本的 chrome 在 domready 时有高度计算 bug，加setTimeout 可解决
        window.setTimeout(function() {
            self.initTreeHeight();
        }, 1);

        //窗口大小大变后重新调整高度
        $(window).on('resize', function() {
            self.initTreeHeight();
        })

        //生成树菜单
        this.loadArea();

        //初始化区域搜索框
        this.initSearchArea();

        //初始化右上角下拉菜单
        this.initDropdown();

        //绑定 log out 事件
        $('#logout').on('click', function() {
            self.logout();
        });
    },

    //获取 url 参数
    getUrlParams: function() {
        var arrParams = location.search.replace(/^\?/, '').split('&'),
            params = {};

        for (var i = 0; i < arrParams.length; i++) {
            var arr = arrParams[i].split('=');
            params[arr[0]] = arr[1] || '';
        }

        //添加到全局上下文
        this.params = params;
    },

    //微型 JS 模板引擎
    tmpl: function(str, data) {
        var fn = new Function("obj",
            "var p=[]; with(obj){p.push('" + str
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, function($1) {
                return $1.replace(/'/g, '\r') + '\r'
            })
            .replace(/\t=(.*?)%>/g, "',$1,'")
            .split("\t").join("');")
            .split("%>").join("p.push('")
            .split("\r").join("\\'") + "');}return p.join('');");
        return data ? fn(data) : fn;
    },

    //写 cookie
    setCookie: function(key, value) {
        if (!key || !value) {
            return;
        }

        document.cookie = key + "=" + value;
    },

    //读 cookie
    getCookie: function(key) {
        var value = '';
        var reg = new RegExp("(^| )" + key + "=([^;]*)(;|$)");
        var arr = document.cookie.match(reg) || [];

        if (arr.length) {
            value = arr[2];
        }

        return value;
    },

    //删 cookie
    delCookie: function(key) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 1);
        var cval = this.getCookie(key);
        if (cval != null) {
            document.cookie = key + "=" + cval + ";expires=" + exp.toGMTString();
        }
    },

    //生成 header
    renderHeader: function() {
        var headTmpl = this.tmpl('' +
            '		<div class="logo">IMC-ESDER</div>' +
            '		<div class="topbar">' +
            '			<ul>' +
            '				<li class="dropdown"><a href="javascript:void(0);"><%=username%><span class="arrow-down"></span></a>' +
            '					<ul>' +
            '						<li><a href="modify-account.html">Modify account</a></li>' +
            '						<li><a id="logout" href="javascript:void(0);">Log out</a></li>' +
            '					</ul>' +
            '				</li>' +
            '				<li><a href="help.html">Help</a></li>' +
            '			</ul>' +
            '		</div>' +
            '		<div class="navbar">' +
            '			<ul>' +
            '				<li><a href="status.html" <%if (!path.indexOf("/status.html")) {%>class="selected"<%}%>>Status</a></li>' +
            '				<li><a href="audit.html" <%if (!path.indexOf("/audit.html")) {%>class="selected"<%}%>>Audit</a></li>' +
            '				<li><a href="report.html" <%if (!path.indexOf("/report.html")) {%>class="selected"<%}%>>Report</a></li>' +
            '				<li><a href="settings.html" <%if (!path.indexOf("/settings.html")) {%>class="selected"<%}%>>Settings</a></li>' +
            '			</ul>' +
            '		</div>');

        $('.header').html(headTmpl({
            username: this.getCookie('username'),
            path: location.pathname
        }));
    },

    //调整树菜单高度
    initTreeHeight: function() {
        // var
        //     $areaTree = $('.area-tree'),
        //     $container = $('.container'),
        //     headerHeight = $('.header').outerHeight(),
        //     containerMargin = parseInt($container.css('margin-top')) + parseInt($container.css('margin-bottom')),
        //     footerHeight = $('.footer').outerHeight(true),
        //     searchHeight = $('.area-search').outerHeight(true),
        //     areaTreePadding = parseInt($areaTree.css('padding-top')) + parseInt($areaTree.css('padding-bottom')),
        //     mainHeight = $('.main').height(),
        //     sideBarHeight = $(window).height() - headerHeight - containerMargin - footerHeight;

        // if (mainHeight > sideBarHeight) {
        //     $areaTree.height(mainHeight - searchHeight - areaTreePadding);
        // } else {
        //     $areaTree.height(sideBarHeight - searchHeight - areaTreePadding);
        // }

        $('.area-tree').height($(window).height() - 205);
    },

    //初始化区域搜索框
    initSearchArea: function() {
        $('.search .keywords').on('keyup', function() {
            var keywords = this.value.toLowerCase();
            var $treeMenu = $('#tree-menu');
            $treeMenu.children('li').each(function(index, el) {
                var areaName = $(el).find('.area').text().toLowerCase();
                if (~areaName.indexOf(keywords)) {
                    $(el).show();
                } else {
                    $(el).hide();
                }
            });

            //无结果时显示提示信息
            var resultNum = $treeMenu.children('li:visible').length;
            if (resultNum === 0) {
                if ($treeMenu.children('span').length === 0)
                    $treeMenu.append('<span style="color:#999">No result</span>');
            } else {
                $treeMenu.children('span').remove();
            }
        });
    },

    //初始化右上角下拉菜单
    initDropdown: function() {
        var $dropdown = $('.header .topbar .dropdown ul');
        $('.header .dropdown>a').on('mouseover', function() {
            $dropdown.slideDown(100);
        });
        $dropdown.on('mouseleave', function() {
            setTimeout(function() {
                $dropdown.slideUp(100);
            }, 500);
        });
        $(document).on('click', function() {
            $dropdown.slideUp(100);
        });
    },

    //生成树菜单
    loadArea: function() {
        var self = this,
            $tree = $('.area-tree');

        //先从 sessionStorage 取数据
        if (window.sessionStorage) {
            var areaList = sessionStorage.areaList || [];
            if (areaList.length) {
                //生成树菜单
                areaList = JSON.parse(areaList);
                makeTree.call(self, areaList);

                return;
            }
        }

        //加载全部区域数据
        $.ajax({
            type: "GET",
            url: "/areas",
            data: null,
            dataType: "json",
            success: function(data) {
                if (data.areaList) {
                    //缓存到数据模型
                    self.areaList = data.areaList;

                    //缓存到 sessionStorage
                    if (window.sessionStorage) {
                        sessionStorage.areaList = JSON.stringify(data.areaList);
                    }

                    //生成树菜单
                    makeTree.call(self, data.areaList);

                } else {
                    //window.alert('Failed to get the area data.');
                    console.error('获取区域列表失败。')
                }
            },
            error: function(err) {
                //window.alert('Failed to get the area data.');
                console.error('获取区域列表失败。');
            }
        });

        //生成树
        function makeTree(data) {
            var self = this,
                menuStatus = {
                    //增加
                    add: function(id) {
                        var strMenuStatus = ',' + self.getCookie('menuStatus') + ',';

                        if (!~strMenuStatus.indexOf(',' + id + ',')) {
                            var newMenuStatus = strMenuStatus + id;
                            self.setCookie('menuStatus', newMenuStatus.replace(/^,+/g, ''));
                        }
                    },

                    //删除
                    remove: function(id) {
                        var strMenuStatus = ',' + self.getCookie('menuStatus') + ',';

                        if (~strMenuStatus.indexOf(',' + id + ',')) {
                            var newMenuStatus = strMenuStatus.replace(',' + id, '').replace(/^,|,$/g, '');
                            if (newMenuStatus) {
                                self.setCookie('menuStatus', newMenuStatus);
                            } else {
                                self.delCookie('menuStatus');
                            }
                        }
                    }
                };

            //生成树的 html
            var html = '<ul id="tree-root"><li class="expanded">All Area<ul id="tree-menu">',
                menuTmpl = self.tmpl('<li class="<%=status%>" data-area-id="<%=id%>"><span class="area"><%=name%></span><ul></ul></li>'),
                menuStatusStr = ',' + this.getCookie('menuStatus') + ','; //树的展开状态

            for (var i = 0; i < data.length; i++) {
                //树的展开状态
                if (~menuStatusStr.indexOf(',' + data[i].id + ',')) {
                    data[i].status = 'expanded';
                } else {
                    data[i].status = 'closed';
                }

                html += menuTmpl(data[i]);
            };

            html += '</ul></li></ul>';

            //渲染到树
            $tree.html(html);

            //加载展开状态的站点
            $('#tree-menu li.expanded').each(function(index, el) {
                self.loadSites($(el));
            });


            //绑定菜单点击事件
            $tree.on('click', '.area', function() {
                var $li = $(this).closest('li');

                //切换展开/收拢样式
                if ($li.attr('class') === 'closed') {
                    $li.attr('class', 'expanded');

                    //缓存菜单状态
                    menuStatus.add($li.attr('data-area-id'));

                    //无站点则加载数据
                    if ($li.find('li').length === 0) {
                        //加载站点数据
                        self.loadSites($li);
                    } else {
                        //展开菜单
                        $li.find('ul').slideDown(100);
                    }
                } else {
                    //收拢菜单
                    $li.attr('class', 'closed').find('ul').slideUp(100);

                    //缓存菜单状态
                    menuStatus.remove($li.attr('data-area-id'));
                }
            });
        }
    },

    //加载站点数据
    loadSites: function($area) {
        var self = this,
            areaId = $area.attr('data-area-id');

        //加载指定区域站点
        $.ajax({
            type: "GET",
            url: "/sites",
            data: {
                areaId: areaId
            },
            dataType: "json",
            beforeSend: function(xhr) {
                //显示 loading 状态
                $area.find('ul').html('<span style="color:#999">Loading...</span>');
            },
            success: function(data) {
                if (data.siteList) {
                    //添加到数据模型
                    var area = self.getAreaById(areaId);
                    if (area) {
                        area.siteList = data.siteList;
                    }

                    //站点列表
                    if (data.siteList.length) {
                        //生成 html
                        var html = '';
                        var siteTmpl = self.tmpl('<li data-site-id="<%=id%>"><span title="<%=status%>" class="site-status-<%=status%>"></span><a<%if (selected) {%> class="selected"<%}%> href="site-details.html?siteId=<%=id%>"><%=name%></a></li>');
                        for (var i = 0, l = data.siteList.length; i < l; i++) {
                            data.siteList[i].selected = self.params.siteId == data.siteList[i].id;
                            html += siteTmpl(data.siteList[i]);
                        };

                        //添加到菜单
                        $area.find('ul').html(html);
                    } else {
                        $area.find('ul').html('<span style="color:#999">No data</span>');
                    }
                } else {
                    $area.find('ul').html('<span style="color:#999">No data</span>');
                    //window.alert('Failed to get the sites data.')
                    console.error('获取站点数据失败。')
                }
            },
            error: function(err) {
                //window.alert('Failed to get the sites data.')
                console.error('获取站点数据失败。');
            }
        });
    },

    //通过 areaId 返回 area 数据模型
    getAreaById: function(areaId) {
        if (this.areaList) {
            var areaList = this.areaList;
            for (var i = areaList.length - 1; i >= 0; i--) {
                if (areaList[i].id === areaId) return areaList[i];
            };
        }

        return [];
    },

    //log out
    logout: function() {
        $.ajax({
            type: "get",
            url: "/mock/logout.json",
            dataType: "json",
            success: function(data) {
                window.location.href = '/index.html';
            },
            error: function(error) {
                window.location.href = '/index.html';
                console.error('退出失败。');
            }
        });
    }

}

Page.extend = function(obj) {
    if (Object.prototype.toString.call(obj) === '[object Object]') {
        obj._init = this.prototype.init;
        obj.constructor = this;
        $.extend(this.prototype, obj);
    }
}

//扩展 jquery 的 grid 插件
$.fn.extend({
    grid: function(option) {
        var $grid = $(this);

        if (!(option && option.ajax.length)) {
            console.error('Grid 缺少 url 配置。');
            return;
        }

        var defaultOption = {
            paging: true,
            pageSize: 20,
            pageNum: 9, //分页码个数
            currentPage: 234,
            order: null,
            filter: null
        };

        var option = $.extend(defaultOption, option);

        var arrColumns = (function() {
            var arrCols = [];
            $grid.find('thead th').each(function(index, el) {
                arrCols.push(el.innerText);
            });

            return arrCols;
        })();

        var grid = {
            element: $grid,
            columns: arrColumns,
            option: option,
            init: function() {
                var self = this;

                this.loading();

                //取数据
                $.ajax({                    
                    type: "GET",
                    url: this.option.ajax,
                    data: self.option.paging ? {
                        startIndex: self.option.pageSize * (self.option.currentPage - 1),
                        amount: self.option.pageSize
                    } : {},
                    dataType: "json",
                    success: function(data) {
                        var arrAlarms = data.alarmsList,
                            $tbody = self.element.find('tbody');
                        if (arrAlarms.length === 0) {
                            $tbody.html('<tr><td colspan="' + self.columns.length + '" class="g-error">No data...</td></tr>');
                        } else {
                            var html = '';
                            for (var i = 0; i < arrAlarms.length; i++) {
                                var tr = '<tr>',
                                    arrTd = arrAlarms[i];
                                for (var j = 0; j < arrTd.length; j++) {
                                    tr += '<td>' + arrTd[j] + '</td>';
                                };
                                tr += '</tr>';
                                html = html + tr;
                            };

                            //填充数据到页面
                            $tbody.html(html);


                            //是否分页
                            if (self.option.paging) {
                                var pageSize = self.option.pageSize,
                                    totalRecords = data.totalRecords,
                                    pageAmount = parseInt(totalRecords / pageSize) + 1,
                                    currentPage = (function() {
                                        var currentPage = 1;
                                        if (self.option.currentPage > 0) {
                                            if (self.option.currentPage < pageAmount) {
                                                currentPage = self.option.currentPage;
                                            } else {
                                                currentPage = pageAmount;
                                            }
                                        }
                                        return currentPage;
                                    })(),
                                    pageNum = pageAmount < self.option.pageNum ? pageAmount : self.option.pageNum,
                                    pageStart = (function() {
                                        var pageStart = 1,
                                            offset = Math.floor(self.option.pageNum / 2);
                                        if (currentPage > offset && currentPage <= pageAmount - offset) {
                                            pageStart = currentPage - offset;
                                        } else if (pageAmount < currentPage + offset) {
                                            pageStart = pageAmount - pageNum + 1;
                                        }
                                        return pageStart;
                                    })(),
                                    pagingTmpl = Page.prototype.tmpl('<div class="paging">'+
                                    '     <ul id="turnTo">'+
                                    '         <li <%if (currentPage === 1) {%>class="p-disabled"<%}%>>Previous</li>'+
                                    '<%if (pageStart > 1) {%>' +
                                    '         <li >1</li>'+
                                    '         <li class="p-disabled">...</li>'+
                                    '<%}%>' +
                                    '<%for (var k = 0; k < pageNum; k++) {%>'+
                                    '         <li <%if (currentPage === pageStart + k) {%>class="p-disabled p-current"<%}%>><%=pageStart + k%></li>'+
                                    '<%}%>'+
                                    '<%if (pageStart + pageNum - 1 < pageAmount) {%>' +
                                    '         <li class="p-disabled">...</li>'+
                                    '         <li ><%=pageAmount%></li>'+
                                    '<%}%>' +
                                    '         <li <%if (currentPage === pageAmount) {%>class="p-disabled"<%}%>>Next</li>'+
                                    '     </ul>'+
                                    '     <div class="p-stat">Showing <%=recordStart%> to <%=recordEnd%> of <%=recordTotal%> entries</div>'+
                                    '     <div style="clear:both"></div>'+
                                    ' </div>');

                                self.element.append(pagingTmpl({
                                    recordStart: pageSize * (currentPage - 1) + 1,
                                    recordEnd: totalRecords < currentPage * pageSize ? totalRecords : currentPage * pageSize,
                                    recordTotal: totalRecords,
                                    currentPage: currentPage,
                                    pageAmount: pageAmount,
                                    pageStart: pageStart,
                                    pageNum: pageNum
                                }));

                                //绑定翻页事件
                                $('#turnTo').on('click', 'li', function() {
                                    $li = $(this);
                                    if ($li.hasClass('p-disabled')) {
                                        return;
                                    }

                                    //跳转页
                                    self.turnTo($li.text());
                                });
                            }

                            //重新调整菜单高度
                            Page.prototype.initTreeHeight();
                        }
                    },
                    error: function(err) {
                        console.error('加载表格数据失败。')
                        self.element.find('tbody').html('<tr><td colspan="' + self.columns.length + '" class="g-error">No data...</td></tr>');
                    }
                });
            },
            turnTo: function(pageNum) {
                if (isNaN(pageNum)) {
                    //快捷翻页
                    if (pageNum === 'Previous') {
                        //
                    } else {
                        //
                    }
                } else {
                    //跳转到指定页
                }
            },
            loading: function() {
                this.element.find('tbody').html('<tr><td colspan="' + this.columns.length + '" class="g-loading">Loading...</td></tr>');
            }
        }

        grid.init();

        return grid;
    }
});