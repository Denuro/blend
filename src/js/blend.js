/* global CKEDITOR, shortcut */
 
"use strict";
//handle the back and forward buttons
var invalidHover = true;
var avoidUrlRegister = false;
var isAjax = false;
var blendJs = function(){};
var blend = {};
blend.plugins = [];

function pluginsRegister()
{
    for (i = 0; i < blend.plugins.length; i++)
    {
        var plugin = blend.plugins[i];
        
        if ( typeof plugin.register == 'function')
        {
            plugin.register();
        }
    }
}

function pluginsStart()
{
    for (i = 0; i < blend.plugins.length; i++)
    {
        var plugin = blend.plugins[i];
        
        if ( typeof plugin.start == 'function')
        {
            plugin.start();
        }
    }
}

//avoid console.log problems
if (!window.console)
{
    window.console = {};
    window.console.log = function ()
    {
    };
}

if (typeof $ == 'function')
{
    window.onpopstate = function(event) 
    {
        var okay = escape();
        
        if ( !okay )
        {
            avoidUrlRegister = true;
            p(window.location.href, true);
        }
        else
        {
            //não mudar a url
            return false;
        }       
    };
}

//Loading without ajax
window.onload =  function ()
{
    pluginsRegister();
    dataAjax();
        
    /**
     * Add support to play method in jquery
     *
     * @returns {jQuery.fn@call;each}
     */
    jQuery.fn.play = function () 
    {
        return this.each(function () 
        {
            if (typeof this.play === 'function')
            {
                this.play();
            }
        });
    };
    
    //jquery plugin to create element
    //https://github.com/ern0/jquery.create/blob/ster/jquery.create.js
    (function($) 
    {
        $.create = function(tag,id) 
        {
            let elm = document.createElement(tag.toUpperCase());

            if (typeof(id) != "undefined") 
            {
                elm.id = id;
            }

            return $(elm);
        }; // $.create()
    }(jQuery));
    
    //destroy popup on esc
    $(document).keyup(function(e) 
    {
        if (e.key === "Escape") 
        {
           return escape();
        }
    });
};

function escape()
{
    console.log('escape');
    //main menu
    if ( $('body').hasClass('menu-open') )
    {
        menuClose();
        return true;
    }
    //popup
    else if ( $('.popup:visible').length )
    {
        //try to call the close action of the popup
        var jsText= $('#btbClosePopup:visible').attr('onclick');
        console.log(jsText);
        
        if (jsText)
        {
            eval(jsText);
        }
        else
        {
           popup('destroy');
        }
        
        return true;
    }
    //calendar
    else if ( $('.xdsoft_datetimepicker.xdsoft_noselect:visible').length )
    {
        $('.xdsoft_datetimepicker.xdsoft_noselect').hide();
        return true;
    }
    //slider full screen
    else if ( $('slider-full-screen').length > 0)
    {
        removeSlideFullScreen();
    }
    
    return false;
}

/**
 * Parse data-ajax attribute, to make a link ajax
 *
 * @returns boolean always false
 */
function dataAjax()
{
    try 
    {
        blendJs();
    }
    catch (e) 
    {
        alert('Erro ao executar javascript da página!');
        console.error(e);
        hideLoading();
    }
    
    pluginsStart();
    
    //clear the function to avoid calling more times
    blendJs = function(){};
	
    //links
    $("[data-ajax]").each(function ()
    {
        var element = $(this);
        var dataAjax = element.attr('data-ajax');
        var href = element.attr('href');
        var disabled = element.attr('disabled');
        element.removeAttr('data-ajax');

        if (href && dataAjax)
        {
            if (disabled == 'disabled')
            {
                element.click(function ()
                {
                    toast('Ação desabilitada!');
                    return false;
                });
            }
            else if (dataAjax === 'noFormData')
            {
                element.click(function () {
                    return g(href, '');
                });
            } 
            else
            {
                element.click(function () {
                    return p(href);
                });
            }
        }
    }
    );

    //on press enter
    $("[data-on-press-enter]").each(function ()
    {
        var element = $(this);
        var myEvent = element.attr('data-on-press-enter');

        //get out if converted
        if (element.attr('data-on-press-enter-converted') == "1")
        {
            return;
        }

        //mark as converted
        element.attr('data-on-press-enter-converted', "1");
        element.keydown(
                function (e)
                {
                    if (e.keyCode == "13" && !e.shiftKey)
                    {
                        eval(myEvent);
                        e.preventDefault();
                    } else
                    {
                        return true;
                    }
                }
        );
    }
    );

    //remove invalid on change
    $('[data-invalid=1]').change(function () 
    {
        //remove data-invalid for element
        $(this).removeAttr('data-invalid');
        
        //remove hint
        $(this).parent().find('.hint.danger').fadeOut(500, function () 
        {
            $(this).remove();
        });
        
        var tab = $(this).parents('.tabBody .item');
        
        //if is inside tab and tab don't has any element with data-invalid
        //remove data-invalid from tab
        if ( tab.length > 0)
        {
            tab = tab.eq(0);
            var hasInvalidInside = tab.find('[data-invalid="1"]').length > 0 ;

            if ( !hasInvalidInside)
            {
                $('#'+tab.attr('id')+'Label').removeAttr('data-invalid');
            }
        }
    });

    //make invalid
    $('[data-invalid=1]').each(function () 
    {
        var element = $(this);
        var title = element.attr('title');
        var tab = element.parents('.tabBody .item');
        
        //inside tab
        if ( tab[0])
        {
            $('#'+$(tab[0]).attr('id')+'Label').attr('data-invalid',1);
        }
        
        //don't create hint for hidden elements
        if (!element.is(':visible'))
        {
            return;
        }
        
        if (invalidHover == true)
        {
            if (title !== undefined)
            {
                element.hover(function ()
                {
                    var position = element.position().left + element.width()
                    var myDiv = $('<div class="hint danger">' + element.attr('title') + '</div>');
                    myDiv.css('left', position);

                    element.parent().append(myDiv);
                },
                function ()
                {
                    $(element).parent().find(".hint").remove();
                });
            }
        } 
        else
        {
            var position = element.position().left + element.width()
            var myDiv = $('<div class="hint danger">' + element.attr('title') + '</div>');
            myDiv.css('left', position);

            element.parent().append(myDiv);
        }
    });

    //make masks work
    if (typeof jQuery().mask == 'function')
    {
        applyAllMasks(); 
    }

    //input float and integer
    if (typeof ($('input.float').autoNumeric) === "function")
    {
        applyAutonumeric();
    }

    if (typeof ($('.swipebox').swipebox) === "function")
    {
        $('.swipebox').swipebox();
    }

    //multipleSelect();
    if (typeof seletMenuItem == 'function') 
    {
        seletMenuItem();
    }
    
    dateTimeInput();
    
    //add system class
    if ( isIos())
    {
        $('body').removeClass('os-ios').addClass('os-ios');
    }
    else if ( isAndroid())
    {
        $('body').removeClass('os-android').addClass('os-android');
    }
    
    //blend slider
    $('.slider').each(function ()
    {
        slide('#' + $(this).attr('id'))
    });
    
    if (typeof actionList == 'function')
    {
        actionList.restore();
    }
    
    if ( typeof grid =='function')
    {
        grid.restoreTextSize();    
    }
    
    hideLoading();

    return false;
}

function applyAutonumeric()
{
    $('input.float').autoNumeric('init');
    
    //limpa campo quando entrar nele e for zerado
    $('input.float').focus(function () {
        if ($(this).val() == '0,00')
        {
            $(this).val('');
        }
    });

    //limpa campo quando entrar nele e for zerado
    $('input.float').blur(function () {
        if ($(this).val() == '')
        {
            $(this).val('0,00');
        }
    });

    $('input.integer').autoNumeric('init');
}

/**
 * Update browser url
 *
 * @param {string} page
 * @returns {void}
 */
function updateUrl(page)
{
    if (window.history.pushState === undefined || page === 'undefined')
    {
        return false;
    }

    if (avoidUrlRegister)
    {
        avoidUrlRegister = false;
        return false;
    }

    var urlToRegister = correctUrl(page);
    window.history.pushState({url: urlToRegister}, "", urlToRegister);
    avoidUrlRegister = false;
    return true;
}

function getBaseUrl()
{
    var bases = document.getElementsByTagName('base');
    var base = '';
    
    if ( bases && bases[0])
    {
        base = bases[0].href;
    }
    
    return base;
}

function correctUrl(url)
{
    var base = getBaseUrl();

    //make full url
    if (!startsWith(url, base))
    {
        url = base + url;
    }

    //remove # and after from end
    url = url.split('#')[0];

    //remove ? in end
    if (url.substr(-1, 1) === '?')
    {
        url = url.substr(0, url.length - 1);
    }

    return url;
}

/**
 * Page Post
 *
 * @param {String} page
 * @param {String} formData
 * @returns {Boolean}
 */
function p(page, formData, callBack)
{
    return r("POST", page, formData, callBack);
}

/**
 * Page get
 *
 * @param {String} page
 * @param {String} formData
 * @returns {Boolean}
 */
function g(page, formData)
{
    return r("GET", page, formData);
}

/**
 * Make a event to current page
 *
 * @param {string} event
 * @param {mixed} formData
 * @returns {boolean}
 */
function e(event, formData)
{
    return p(getCurrentPage() + '/' + event, formData);
}

/**
 * http://abandon.ie/notebook/simple-file-uploads-using-jquery-ajax
 *
 * @deprecated since 25/09/2014
 *
 * @param {string} page saasd
 * @returns boolean false
 */
function fileUpload(page)
{
    var data = new FormData();

    // Adiciona todos arquivos selecionados no campo
    jQuery.each($('input[type=file]'), function (i, element)
    {
        var files = $(element).prop('files');

        for (var x = 0; x < files.length; x++)
        {
            data.append('file-' + i + x, files[x]);
        }
    });

    // Adiciona demais campos do formulário
    $('input, select').each(function ()
    {
        data.append(this.name, this.value);
    });

    return r("POST", page, data);
}

var avoidTab = function ()
{
    var keyCode = event.keyCode || event.which;

    if (keyCode == 9)
    {
        event.preventDefault();
    }
}

function showLoading()
{
    $("body").bind("keydown", avoidTab);
    $(".loading").fadeIn('fast');
}

function hideLoading()
{
    $("body").unbind("keydown", avoidTab);
    $(".loading").fadeOut('fast');
}

/**
 *
 * Make a ajax to a page
 *
 * @param {string} type
 * @param {string} page
 * @param {string} formData
 * @returns {Boolean} Boolean always return fase, so it can be use in buttons and onclicks
 */
function r(type, page, formData, callBack)
{
    isAjax = true;
    var focused = $(':focus');

    //disable focused element, perhaps a button or link
    if (typeof focused.get(0) != 'undefined')
    {
        if (focused.get(0).tagName == 'a' || focused.get(0).tagName == 'button')
        {
            focused.attr('disabled', true);
        }
    }

    showLoading();
    
    //TODO refactor to plugin
    if (typeof updateEditors == 'function')
    {
        updateEditors();
    }

    var host = $('base').attr('href');
    var url = host + page.replace(host, '');

    //default jquery value https://api.jquery.com/jQuery.ajax/
    var contentType = 'application/x-www-form-urlencoded; charset=UTF-8';

    if (typeof formData === 'undefined' || formData == null )
    {
        if ($('input[type=file]').length > 0)
        {
            contentType = false;
            var formData = new FormData();

            // Adiciona todos arquivos selecionados no campo
            jQuery.each($('input[type=file]'), function (i, element)
            {
                var files = $(element).prop('files');
                formData.append('file-' + i, files[0]);
            });

            // Adiciona demais campos do formulário
            $('input, select, textarea').each(function ()
            {
                formData.append(this.name, this.value);
            });

            //control uncked checkbox
            $("input:checkbox:not(:checked)").each(function ()
            {
                formData.append(this.name, '0');
            });

            //minnor support for multiple values
            $("select[multiple]").each(function () {
                var el = $(this);
                var id = el.attr('id').replace('[', '\\[').replace(']', '\\]');
                var name = el.attr('name').replace('[', '').replace(']', '');

                var value = Array();

                $("#" + id + " :selected").map(function (i, el) {
                    value[i] = $(el).val();
                });

                formData.append(name, value);
            });
        }
        else
        {
            formData = $('form').serialize();

            //add server class to post
            $('[data-server-class]').each(
                    function () {
                        formData += '&data-server-class[' + $(this).attr('id') + ']=' + $(this).data('server-class');
                    }
            )

        }
    } else
    {
        if (formData instanceof FormData)
        {
            contentType = false;
        } 
        else if (typeof formData == 'object')
        {
            formData = $.param(formData);
        }
    }

    $.ajax({
        type: type,
        url: url,
        data: formData,
        cache: false,
        dataType: "json",
        contentType: contentType,
        processData: false,
        xhrFields: {
            withCredentials: true //make cookie work on ajax
        },
        success: function (data)
        {
            //enable the focused element
            focused.removeAttr('disabled');

            if (!data)
            {
                toast('Sem retorno do servidor!', 'danger');
                hideLoading();
                return;
            }

            //only make response if content exists, to avoid clean
            if (data.content !== '')
            {
                if (data.responseType === 'append')
                {
                    $('#' + data.response).append(data.content);
                } else
                {
                    $('#' + data.response).html(data.content);
                }
            }

            //try to get page from data.pushsate
            if (typeof data.pushState !== undefined && data.pushState !== null)
            {
                if (data.pushState.length > 0)
                {
                    page = data.pushState;
                }
            }

            //if is GET get page from url+ formdata
            if (type === 'GET')
            {
                page = url + '?' + formData;
            }
            
            updateUrl(page);
            //put the js inside body element, to execute
            data.script.replace('\\\"', '\\"');
            $('body').append('<script>' + data.script + '</script>');
            //treat js especials
            dataAjax();
            
            if ( typeof callBack == 'function')
            {
                callBack();
            }
        }
        ,
        error: function (xhr, ajaxOptions, thrownError)
        {
            hideLoading();

            if (xhr.responseText === '')
            {
                toast('Sem resposta do servidor! Verifique sua conexão!', 'alert');
            } else
            {
                focused.removeAttr('disabled');
                toast(xhr.responseText);
                dataAjax();
            }
        }
    });

    return false;
}

function getJson(page, formData, loadingShow, callBack)
{
    var host = $('base').attr('href');
    var url = host + page.replace(host, '');

    if (loadingShow)
    {
        showLoading();
    }

    $.ajax({
        dataType: "json",
        method: "POST",
        url: url,
        async: true,
        timeout: 20000,
        data: formData,
        xhrFields: {
            withCredentials: true //make cookie work on ajax
        },
        success: function (response)
        {
            if (response && typeof response.script == 'string')
            {
                response.script.replace('\\\"', '\\"');
                $('body').append('<script>' + response.script + '</script>');
            } 
            else if ( typeof callBack == 'function')
            {
                callBack(response);
            }
            
            hideLoading();
        }
        , error: function (xhr, ajaxOptions, thrownError)
        {
            if (xhr.responseText === '')
            {
                toast('Sem resposta do servidor! Verifique sua conexão!', 'alert');
            }
            
            hideLoading();
        }
    });
}

function getSelected(selector)
{
    var result = $(selector).map(function (i, el) {
        return $(el).val();
    });

    return
}

/**
 * Return current page
 * @returns {string}
 */
function getCurrentPage()
{
    var relativeUrl = window.location.pathname.replace($('base').attr('href').replace(window.location.protocol + '//' + window.location.host, ''), '');
    return relativeUrl.split('/')[0];
}

/**
 * Return current event
 * @returns {string}
 */
function getCurrentEvent()
{
    var relativeUrl = window.location.pathname.replace($('base').attr('href').replace(window.location.protocol + '//' + window.location.host, ''), '');
    return relativeUrl.split('/')[1];
}

/**
 * Make a simple toast, cool not?
 *
 * @param msg message to show in toast.
 * @param type additional css class.
 * @param duration int.
 * @returns Boolean false.
 */
function toast(msg, type, duration)
{
    duration = duration === undefined ? 3000 : duration;
    type = type+ '' === 'undefined' ? '' : type;
    var toast = $("<div class='toast " + type + "'>" +
            msg +
            "<strong style=\"float:right;cursor:pointer;\" onclick=\"$(this).parent().remove();\">X</strong></div>")
            .appendTo('body');
            
    setTimeout(function(){toast.addClass('show')}, 100);
    setTimeout(function(){toast.removeClass('show')}, duration);
    setTimeout(function(){toast.remove()}, duration*2);

    return false;
}

/**
 * Set focus on first field.
 * Supports popup;
 *
 * @returns false;
 */
function setFocusOnFirstField()
{
    //support popup
    if ($('.popup').length)
    {
        $('.popup').find('input:not([readonly]):not([disabled]):first').focus();
    } 
    else
    {
        $('.content input:not([readonly]):not([disabled]):first').focus();
    }

    return false;
}

/**
 * Send focus to next element, work great with on-press-enter
 * @returns {undefined}
 */
function focusNextElement()
{
    var element = document.activeElement;

    if (element)
    {
        var inputs = $(':input:visible, select:visible, a:visible').not('[tabindex=-1]').not('[disabled]').not('[readonly]');
        var next = inputs.eq(inputs.index(element) + 1);
        next.focus();
    }
}

function addScriptOnce(src, callBack)
{
    var list = document.getElementsByTagName('script');
    var i = list.length;
    var findedOnDoc = false;
    var compare = src.replace(getBaseUrl(),'');

    //verify if is already loaded
    while (i--)
    {
        var myCompare = list[i].src.replace(getBaseUrl(),'');
        if ( myCompare == compare)
        {
            findedOnDoc = true;
            break;
        }
    }
    
    // if we didn't find it on the page, add it
    if (!findedOnDoc)
    {
        var script = document.createElement('script');
        script.src = src;
        script.onload = callBack;
        document.getElementsByTagName('body')[0].appendChild(script);
    }
    //if already on document, we only call the callback
    else
    {
        callBack();
    }
}
