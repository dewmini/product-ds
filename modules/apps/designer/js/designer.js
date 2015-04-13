$(function () {
    //TODO: cleanup this

    var dashboardUrl = ues.utils.relativePrefix() + 'dashboards';

    var dashboard;

    var page;

    var storeCache = {};

    Handlebars.registerHelper('has', function () {
        var has = function (o) {
            if (!o) {
                return false;
            }
            if (o instanceof Array && !o.length) {
                return false;
            }
            var key;
            for (key in o) {
                if (o.hasOwnProperty(key)) {
                    return true;
                }
            }
            return false;
        };
        var args = Array.prototype.slice.call(arguments);
        var options = args.pop();
        var length = args.length;
        if (!length) {
            return new Handlebars.SafeString(options.inverse(this));
        }
        var i;
        for (i = 0; i < length; i++) {
            if (has(args[i])) {
                return new Handlebars.SafeString(options.fn(this));
            }
        }
        return new Handlebars.SafeString(options.inverse(this));
    });

    Handlebars.registerHelper('dump', function (o) {
        return JSON.stringify(o);
    });

    var layoutsListHbs = Handlebars.compile($("#layouts-list-hbs").html());

    var layoutHbs = Handlebars.compile($("#layout-hbs").html());

    var widgetsListHbs = Handlebars.compile($("#widgets-list-hbs").html());

    var widgetToolbarHbs = Handlebars.compile($("#widget-toolbar-hbs").html());

    var widgetOptionsHbs = Handlebars.compile($("#widget-options-hbs").html());

    var designerHbs = Handlebars.compile($("#designer-hbs").html());

    var randomId = function () {
        return Math.random().toString(36).slice(2);
    };

    var findStoreCache = function (type, id) {
        var i;
        var item;
        var items = storeCache[type];
        var length = items.length;
        for (i = 0; i < length; i++) {
            item = items[i];
            if (item.id === id) {
                return item;
            }
        }
    };

    var findWidget = function (id) {
        var i;
        var length;
        var area;
        var widget;
        var widgets;
        var content = page.content;
        for (area in content) {
            if (content.hasOwnProperty(area)) {
                widgets = content[area];
                length = widgets.length;
                for (i = 0; i < length; i++) {
                    widget = widgets[i];
                    if (widget.id === id) {
                        return widget;
                    }
                }
            }
        }
    };

    var saveWidgetOptions = function (id, data) {
        var o;
        var opt;
        var block = findWidget(id);
        var content = block.content;
        var options = content.options;
        var opts = data.options;
        for (opt in opts) {
            if (opts.hasOwnProperty(opt)) {
                o = options[opt];
                o.value = data[opt];
            }
        }
        var event;
        var listener;
        var notifiers = data.notifiers;
        var listen = content.listen;
        for (event in notifiers) {
            if (notifiers.hasOwnProperty(event)) {
                listener = listen[event];
                listener.on = notifiers[event];
            }
        }
        ues.dashboards.rewire(page);
        saveDashboard(dashboard);
    };

    var removeWidget = function (widget) {
        ues.widgets.destroy(widget, function (err) {
            var container = $('#' + widget.id);
            var area = container.closest('.ues-widget-box').attr('id');
            var content = page.content;
            area = content[area];
            var index = area.indexOf(widget);
            area.splice(index, 1);
            container.remove();

            var el = $('#middle').find('.ues-designer .ues-options');
            var oid = el.find('.ues-save').data('id');
            if (oid !== widget.id) {
                return;
            }
            el.empty();
        });
    };

    var previewDashboard = function (page) {
        window.open(dashboardUrl + '/' + dashboard.id + '/' + page.id, '_blank');
    };

    var saveDashboard = function (dashboard) {
        $.ajax({
            url: dashboardUrl,
            method: 'POST',
            data: JSON.stringify(dashboard),
            contentType: 'application/json'
        }).success(function (data) {
            console.log('dashboard saved successfully');
        }).error(function () {
            console.log('error saving dashboard');
        });
    };

    var initWidgetToolbar = function () {
        var designer = $('#middle').find('.ues-designer');
        designer.on('click', '.ues-widget .ues-toolbar .ues-options-handle', function () {
            var id = $(this).closest('.ues-widget').attr('id');
            renderWidgetOptions(findWidget(id));
        });
        designer.on('click', '.ues-widget .ues-toolbar .ues-trash-handle', function () {
            var id = $(this).closest('.ues-widget').attr('id');
            removeWidget(findWidget(id));
        });
        designer.on('mouseenter', '.ues-widget .ues-toolbar .ues-move-handle', function () {
            $(this).draggable({
                cancel: false,
                appendTo: 'body',
                helper: 'clone',
                start: function (event, ui) {
                    console.log('dragging');
                },
                stop: function () {
                    //$('#left a[href="#widgets"]').tab('show');
                }
            });
        }).on('mouseleave', '.ues-widget .ues-toolbar .ues-move-handle', function () {
            $(this).draggable('destroy');
        });
    };

    var renderWidgetToolbar = function (widget) {
        $('#' + widget.id).prepend($(widgetToolbarHbs(widget)))
    };

    var renderWidget = function (container, wid) {
        var id = randomId();
        //TODO: remove hardcoded gadget
        var asset = findStoreCache('gadget', wid);
        var area = container.attr('id');
        var content = page.content;
        content = content[area] || (content[area] = []);
        var widget = {
            id: id,
            content: asset
        };
        content.push(widget);
        ues.widgets.create(container, widget, function (err, block) {
            var widget = findWidget(id);
            renderWidgetToolbar(widget);
            renderWidgetOptions(widget);
        });
    };

    var moveWidget = function (container, id) {
        var widget = findWidget(id);
        var area = container.attr('id');
        var content = page.content;
        content = content[area] || (content[area] = []);
        content.push(widget);
        removeWidget(widget);
        ues.widgets.create(container, widget, function (err, block) {
            var widget = findWidget(id);
            renderWidgetToolbar(widget);
            renderWidgetOptions(widget);
        });
    };

    var widgetNotifiers = function (notifiers, current, widget) {
        if (current.id === widget.id) {
            return;
        }
        var notify = widget.content.notify;
        if (!notify) {
            return;
        }
        var event;
        var events;
        var data;
        for (event in notify) {
            if (notify.hasOwnProperty(event)) {
                data = notify[event];
                events = notifiers[data.type] || (notifiers[data.type] = []);
                events.push({
                    from: widget.id,
                    event: event,
                    type: data.type,
                    content: widget.content,
                    description: data.description
                });
            }
        }
    };

    var areaNotifiers = function (notifiers, widget, widgets) {
        var i;
        var length = widgets.length;
        for (i = 0; i < length; i++) {
            widgetNotifiers(notifiers, widget, widgets[i]);
        }
    };

    var pageNotifiers = function (widget, page) {
        var area;
        var notifiers = {};
        var content = page.content;
        for (area in content) {
            if (content.hasOwnProperty(area)) {
                areaNotifiers(notifiers, widget, content[area]);
            }
        }
        return notifiers;
    };

    var findNotifiers = function (widget, page) {
        var event, listener, notifiers;
        var listeners = [];
        var content = widget.content;
        var listen = content.listen;
        if (!listen) {
            return listeners;
        }
        notifiers = pageNotifiers(widget, page);
        for (event in listen) {
            if (listen.hasOwnProperty(event)) {
                listener = listen[event];
                listeners.push({
                    event: event,
                    title: listener.title,
                    description: listener.description,
                    notifiers: notifiers[listener.type]
                });
            }
        }
        console.log(listeners);
        return listeners;
    };

    var wiredNotifier = function (from, event, notifiers) {
        var i, notifier;
        var length = notifiers.length;
        for (i = 0; i < length; i++) {
            notifier = notifiers[i];
            if (notifier.from === from && notifier.event === event) {
                return notifier;
            }
        }
    };

    var wireEvent = function (on, notifiers) {
        var i, notifier;
        var length = on.length;
        for (i = 0; i < length; i++) {
            notifier = on[i];
            notifier = wiredNotifier(notifier.from, notifier.event, notifiers);
            if (!notifier) {
                continue;
            }
            notifier.wired = true;
        }
    };

    var eventNotifiers = function (event, notifiers) {
        var i, events;
        var length = notifiers.length;
        for (i = 0; i < length; i++) {
            events = notifiers[i];
            if (events.event === event) {
                return events.notifiers;
            }
        }
    };

    var wireEvents = function (widget, notifiers) {
        var listen = widget.content.listen;
        if (!listen) {
            return notifiers;
        }
        var event, on;
        for (event in listen) {
            if (listen.hasOwnProperty(event)) {
                on = listen[event].on;
                if (!on) {
                    continue;
                }
                wireEvent(on, eventNotifiers(event, notifiers));
            }
        }
        return notifiers;
    };

    var buildOptionsContext = function (widget, page) {
        var notifiers = findNotifiers(widget, page);
        return {
            id: widget.id,
            options: widget.content.options,
            listeners: wireEvents(widget, notifiers)
        };
    };

    var renderWidgetOptions = function (widget) {
        var ctx = buildOptionsContext(widget, page);
        $('#middle').find('.ues-designer .ues-options').html(widgetOptionsHbs(ctx))
            .find('.ues-sandbox').on('click', '.ues-save', function () {
                var thiz = $(this);
                var id = thiz.data('id');
                var notifiers = {};
                var opts = {};
                var sandbox = thiz.closest('.ues-sandbox');
                $('.properties input', sandbox).each(function () {
                    var el = $(this);
                    opts[el.attr('name')] = el.val();
                });
                $('.properties select', sandbox).each(function () {
                    var el = $(this);
                    opts[el.attr('name')] = el.val();
                });
                $('.notifiers .notifier', sandbox).each(function () {
                    var el = $(this);
                    var from = el.data('from');
                    var event = el.data('event');
                    var listener = el.closest('.listener').data('event');
                    var events = notifiers[listener] || (notifiers[listener] = []);
                    if (!el.is(':checked')) {
                        return;
                    }
                    events.push({
                        from: from,
                        event: event
                    });
                });
                saveWidgetOptions(id, {
                    options: opts,
                    notifiers: notifiers
                });
            });
    };

    var loadWidgets = function (start, count) {
        ues.store.gadgets({
            start: start,
            count: count
        }, function (err, data) {
            storeCache.gadget = data;
            $('#middle').find('.ues-widgets .ues-content').html(widgetsListHbs(data));
        });
    };

    var initWidgets = function () {
        $('.ues-widgets').on('mouseenter', '.thumbnail .ues-drag-handle', function () {
            $(this).draggable({
                cancel: false,
                appendTo: 'body',
                helper: 'clone',
                start: function (event, ui) {
                    console.log('dragging');
                    $('#left').find('a[href="#designer"]').tab('show');
                },
                stop: function () {
                    //$('#left a[href="#widgets"]').tab('show');
                }
            });
        }).on('mouseleave', '.thumbnail .ues-drag-handle', function () {
            $(this).draggable('destroy');
        });
    };

    var initTabs = function () {
        $('#left')
            .find('.nav-tabs a')
            .click(function (e) {
                e.preventDefault();
                var el = $(this);
                el.tab('show');
            });
    };

    var listenLayout = function () {
        $('#middle').find('.ues-designer')
            .children('.ues-toolbar')
            .find('.ues-page').on('click', function () {
                newPage(pageOptions());
            }).end()
            .find('.ues-save').on('click', function () {
                saveDashboard(dashboard);
            }).end()
            .find('.ues-preview').on('click', function () {
                previewDashboard(page);
            }).end()
            .end()
            .find('.ues-widget-box').droppable({
                //activeClass: 'ui-state-default',
                hoverClass: 'ui-state-hover',
                //accept: ':not(.ui-sortable-helper)',
                drop: function (event, ui) {
                    //$(this).find('.placeholder').remove();
                    var id = ui.helper.data('id');
                    var action = ui.helper.data('action');
                    var el = $(this);
                    switch (action) {
                        case 'move':
                            moveWidget(el, id);
                            break;
                        default:
                            renderWidget(el, id);
                    }
                }
            });
    };

    var layoutContainer = function () {
        return $('#middle').find('.ues-designer').html(layoutHbs()).find('.ues-layout');
    };

    var createPage = function (options, lid) {
        var layout = findStoreCache('layout', lid);
        $.get(layout.url, function (data) {
            var id = options.id;
            layout.content = data;
            page = {
                id: id,
                title: options.title,
                layout: layout,
                content: {}
            };
            dashboard.landing = dashboard.landing || id;
            dashboard.pages[id] = page;
            var container = layoutContainer();
            ues.dashboards.render(container, dashboard, id, function () {
                listenLayout();
            });
        }, 'html');
    };

    var initExisting = function (landing) {
        page = dashboard.pages[landing];
        if (!page) {
            throw 'specified page : ' + landing + ' cannot be found';
        }
        var container = layoutContainer();
        ues.dashboards.render(container, dashboard, landing, function () {
            $('#middle').find('.ues-designer .ues-widget').each(function () {
                var id = $(this).attr('id');
                renderWidgetToolbar(findWidget(id));
            });
            listenLayout();
        });
    };

    var pageOptions = function (type) {
        switch (type) {
            case 'landing':
                return {
                    id: 'landing',
                    title: 'My Dashboard'
                };
            case 'login':
                return {
                    id: 'login',
                    title: 'Login'
                };
            default:
                var pid;
                var prefix = 'page';
                var titlePrefix = 'Page ';
                var i = 0;
                var pages = dashboard.pages;
                while (true) {
                    pid = prefix + i;
                    if (!pages[pid]) {
                        return {
                            id: pid,
                            title: titlePrefix + i
                        };
                    }
                }
        }
    };

    var initFresh = function () {
        ues.store.layouts({
            start: 0,
            count: 20
        }, function (err, data) {
            storeCache.layout = data;
            $('#middle')
                .find('.ues-designer .ues-content').html(layoutsListHbs(data))
                .on('click', '.thumbnails .ues-add', function () {
                    createPage(pageOptions('landing'), $(this).data('id'));
                });
        });
    };

    var newPage = function (page) {
        ues.store.layouts({
            start: 0,
            count: 20
        }, function (err, data) {
            storeCache.layout = data;
            $('#middle')
                .find('.ues-designer .ues-content').html(layoutsListHbs(data))
                .on('click', '.thumbnails .ues-add', function () {
                    createPage(pageOptions(), $(this).data('id'));
                });
        });
    };

    var initDashboard = function (db, page) {
        if (db) {
            dashboard = db;
            initExisting(page || db.landing);
            return;
        }
        dashboard = {
            id: randomId(),
            pages: {}
        };
        initFresh();
    };

    initTabs();
    initWidgetToolbar();
    initWidgets();
    loadWidgets(0, 20);
    initDashboard(ues.global.dashboard, ues.global.page);

});